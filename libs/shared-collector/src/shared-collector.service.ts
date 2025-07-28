import type {
  Event,
  EventMessage,
  FacebookUser,
  TiktokUser,
} from "@app/constants";
import { PrismaService } from "@app/prisma";
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import {
  connect,
  consumerOpts,
  createInbox,
  JetStreamClient,
  JetStreamSubscription,
  JSONCodec,
  NatsConnection,
} from "nats";
import { collectDefaultMetrics, Counter, Registry } from "prom-client";

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

@Injectable()
export class SharedCollectorService
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown
{
  private logger = new Logger(SharedCollectorService.name);
  private nc: NatsConnection;
  private js: JetStreamClient;
  private sub?: JetStreamSubscription;
  private jsc = JSONCodec<Event>();
  private register = new Registry();
  private successfulEventsCounter: Counter;
  private failedEventsCounter: Counter;

  constructor(
    private readonly prisma: PrismaService,
    @Inject("SOURCE_NAME") private readonly source: "facebook" | "tiktok",
  ) {
    collectDefaultMetrics({ register: this.register });

    this.successfulEventsCounter = new Counter({
      name: "collector_processed_events_total",
      help: "Total number of successfully processed events by collector",
      labelNames: ["source"],
      registers: [this.register],
    });

    this.failedEventsCounter = new Counter({
      name: "collector_failed_events_total",
      help: "Total number of failed events by collector",
      labelNames: ["source"],
      registers: [this.register],
    });
  }

  async onModuleInit() {
    this.nc = await connect({
      servers: process.env.NATS_URL || "nats://nats:4222",
    });
    this.js = this.nc.jetstream();

    const opts = consumerOpts();
    opts.durable(`${this.source}-durable`);
    opts.manualAck();
    opts.ackExplicit();
    opts.deliverTo(createInbox());

    const maxRetries = 10;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        this.sub = await this.js.subscribe(this.source, opts);
        this.logger.log(`Subscribed to ${this.source} stream`);
        break;
      } catch (err) {
        this.logger.warn(
          `Attempt ${attempt + 1}/${maxRetries}: Stream not ready yet. Retrying... ${err.message}`,
        );
        attempt++;
        await wait(1000);
      }
    }

    if (!this.sub) {
      throw new Error(
        `Failed to subscribe to ${this.source} after ${maxRetries} attempts`,
      );
    }

    this.processMessages().catch((err) => this.logger.error(err));
  }

  async processMessages() {
    if (!this.sub) {
      this.logger.error("Subscription not initialized");
      return;
    }

    for await (const msg of this.sub) {
      let decoded: EventMessage;
      try {
        decoded = this.jsc.decode(msg.data) as unknown as EventMessage;
      } catch (decodeError) {
        this.failedEventsCounter.labels(this.source).inc();
        this.logger.error(`Failed to process message: ${decodeError.message}`);
        continue;
      }
      const event: Event = decoded.data;
      try {
        await this.saveEventToDB(event);

        this.logger.log(
          JSON.stringify({
            message: "saved event to DB",
            eventId: event.eventId,
            source: event.source,
            eventType: event.eventType,
            timestamp: new Date().toISOString(),
          }),
        );

        this.successfulEventsCounter.labels(this.source).inc();

        msg.ack();
      } catch (error) {
        this.failedEventsCounter.labels(this.source).inc();
        this.logger.log(
          JSON.stringify({
            message: `Failed to save event to DB: ${error.message}`,
            eventId: event.eventId,
            source: event.source,
            eventType: event.eventType,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    }
  }

  getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  async saveEventToDB(event: Event) {
    const baseData = {
      id: event.eventId,
      timestamp: new Date(event.timestamp),
      source: event.source,
      funnelStage: event.funnelStage,
      eventType: event.eventType,
    };
    let eventData = {};
    if (event.source === "facebook") {
      eventData = { facebookEvent: { create: this.mapFacebookEvent(event) } };
    } else {
      eventData = { tiktokEvent: { create: this.mapTiktokEvent(event) } };
    }
    await this.prisma.event.create({
      data: {
        ...baseData,
        ...eventData,
      },
    });
  }

  private mapFacebookEvent(event: Event) {
    const fbUser = event.data.user as FacebookUser;

    return {
      userId: event.data.user.userId,
      userName: fbUser.name,
      userAge: fbUser.age,
      userGender: fbUser.gender,
      userCity: fbUser.location.city,
      userCountry: fbUser.location.country,
      engagementType: event.funnelStage,
      referrer:
        "referrer" in event.data.engagement
          ? event.data.engagement.referrer
          : undefined,
      videoId:
        "videoId" in event.data.engagement
          ? event.data.engagement.videoId
          : undefined,
      adId:
        "adId" in event.data.engagement
          ? event.data.engagement.adId
          : undefined,
      campaignId:
        "campaignId" in event.data.engagement
          ? event.data.engagement.campaignId
          : undefined,
      clickPosition:
        "clickPosition" in event.data.engagement
          ? event.data.engagement.clickPosition
          : undefined,
      device:
        "device" in event.data.engagement
          ? event.data.engagement.device
          : undefined,
      browser:
        "browser" in event.data.engagement
          ? event.data.engagement.browser
          : undefined,
      purchaseAmount:
        "purchaseAmount" in event.data.engagement
          ? Number(event.data.engagement.purchaseAmount)
          : undefined,
    };
  }

  private mapTiktokEvent(event: Event) {
    const tkUser = event.data.user as TiktokUser;

    return {
      userId: event.data.user.userId,
      username: tkUser.username,
      followers: tkUser.followers,
      engagementType: event.funnelStage,
      watchTime:
        "watchTime" in event.data.engagement
          ? event.data.engagement.watchTime
          : undefined,
      percentageWatched:
        "percentageWatched" in event.data.engagement
          ? event.data.engagement.percentageWatched
          : undefined,
      device:
        "device" in event.data.engagement
          ? event.data.engagement.device
          : undefined,
      country:
        "country" in event.data.engagement
          ? event.data.engagement.country
          : undefined,
      videoId:
        "videoId" in event.data.engagement
          ? event.data.engagement.videoId
          : undefined,
      actionTime:
        "actionTime" in event.data.engagement
          ? new Date(event.data.engagement.actionTime)
          : undefined,
      profileId:
        "profileId" in event.data.engagement
          ? event.data.engagement.profileId
          : undefined,
      purchasedItem:
        "purchasedItem" in event.data.engagement
          ? event.data.engagement.purchasedItem
          : undefined,
      purchaseAmount:
        "purchaseAmount" in event.data.engagement
          ? Number(event.data.engagement.purchaseAmount)
          : undefined,
    };
  }

  async onModuleDestroy() {
    if (this.sub) await this.sub.drain();
    if (this.nc && !this.nc.isClosed()) {
      await this.nc.drain();
      await this.nc.closed();
    }
    this.logger.log("NATS connection closed");
  }

  async onApplicationShutdown(signal: string) {
    this.logger.warn(`Application shutting down due to signal: ${signal}`);
    await this.onModuleDestroy();
  }
}
