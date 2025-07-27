import { EventMessage } from "@app/constants";
import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import {
  Codec,
  connect,
  JetStreamClient,
  JetStreamManager,
  JSONCodec,
  NatsConnection,
  StringCodec,
} from "nats";

@Injectable()
export class NatsService
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown
{
  private readonly logger = new Logger(NatsService.name);
  private nc: NatsConnection;
  private jsm: JetStreamManager;
  private js: JetStreamClient;
  private sc: Codec<string>;
  private jsc: Codec<any>;

  constructor() {
    this.sc = StringCodec();
    this.jsc = JSONCodec();
  }

  async connect() {
    if (this.nc && !this.nc.isClosed()) {
      this.logger.log("NATS connection already established.");
      return;
    }
    try {
      this.nc = await connect({
        servers: process.env.NATS_URL || "nats://nats:4222",
      });
      this.jsm = await this.nc.jetstreamManager();
      this.js = this.nc.jetstream();
      await this.jsm.streams.add({ name: "tiktok", subjects: ["tiktok"] });
      await this.jsm.streams.add({
        name: "facebook",
        subjects: ["facebook"],
      });
    } catch (error) {
      this.logger.error(
        `Failed to connect to NATS: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async onModuleInit() {
    await this.connect();
  }

  getJetStream(): JetStreamClient {
    return this.js;
  }

  getStringCodec(): Codec<string> {
    return this.sc;
  }

  getJsonCodec(): Codec<any> {
    return this.jsc;
  }

  async publishJson(subject: string, data: EventMessage) {
    if (!this.js) {
      this.logger.error(
        "JetStream client not initialized. Call connect() first.",
      );
      throw new Error("NATS JetStream not connected.");
    }
    try {
      await this.js.publish(subject, this.jsc.encode(data));
    } catch (error) {
      this.logger.error(
        `Failed to publish message to NATS subject "${subject}": ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  isConnected(): boolean {
    return this.nc && !this.nc.isClosed();
  }

  async onApplicationShutdown(signal: string) {
    this.logger.warn(`Application shutdown due to signal: ${signal}`);
    await this.onModuleDestroy();
  }

  async onModuleDestroy() {
    if (this.nc && !this.nc.isClosed()) {
      this.logger.log("Draining NATS connection...");
      await this.nc.drain();
      await this.nc.close();
      this.logger.log("NATS connection drained and closed.");
    }
  }
}
