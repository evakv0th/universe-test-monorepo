import { Injectable } from "@nestjs/common";
import { collectDefaultMetrics, Counter, Registry } from "prom-client";

@Injectable()
export class PrometheusService {
  private readonly register: Registry;

  public readonly successfulEventsCounter: Counter;
  public readonly failedEventsCounter: Counter;

  constructor() {
    this.register = new Registry();
    collectDefaultMetrics({ register: this.register });

    this.successfulEventsCounter = new Counter({
      name: "gateway_successful_events_total",
      help: "Total number of successfully processed events",
      registers: [this.register],
    });

    this.failedEventsCounter = new Counter({
      name: "gateway_failed_events_total",
      help: "Total number of failed events due to validation",
      registers: [this.register],
    });
  }

  getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}
