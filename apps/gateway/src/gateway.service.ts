import { Event, EventMessage, EventSchema } from "@app/constants";
import { NatsService } from "@app/nats";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { PrometheusService } from "./prometheus/prometheus.service";

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly prometheusService: PrometheusService,
  ) {}

  getHello(): string {
    return "Gateway is up";
  }

  async processIncomingEvents(events: any): Promise<string> {
    const validatedEvents: Event[] = [];
    const invalidEvents: any[] = [];

    const incomingEvents = Array.isArray(events) ? events : [events];

    for (const event of incomingEvents) {
      const result = EventSchema.safeParse(event);
      if (result.success) {
        validatedEvents.push(result.data);
        this.prometheusService.successfulEventsCounter.inc();
      } else {
        this.logger.warn(
          `Event validation failed: ${JSON.stringify(result.error.issues)}`,
        );
        this.prometheusService.failedEventsCounter.inc();
        invalidEvents.push({
          original: event,
          error: result.error.issues,
        });
      }
    }

    this.logger.log(
      `Received ${incomingEvents.length} event(s): ${validatedEvents.length} valid, ${invalidEvents.length} invalid`,
    );

    if (!validatedEvents.length) {
      throw new BadRequestException(`No valid events in payload.`);
    }

    if (!this.natsService.isConnected()) {
      await this.natsService.connect();
    }

    const eventsChunkId = uuidv4();

    for (const event of validatedEvents) {
      const eventObject: EventMessage = {
        eventsChunkId,
        id: uuidv4(),
        source: event.source,
        data: event,
      };

      await this.natsService.publishJson(eventObject.source, eventObject);

      this.logger.log(
        JSON.stringify({
          message: "Published event",
          eventId: eventObject.id,
          chunkId: eventsChunkId,
          source: eventObject.source,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    this.logger.log(
      `Published all ${validatedEvents.length} valid events (chunkId: ${eventsChunkId})`,
    );

    return `Processed ${validatedEvents.length} valid and ${invalidEvents.length} invalid events.`;
  }
}
