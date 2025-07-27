import { Injectable } from "@nestjs/common";
import { collectDefaultMetrics, Histogram, Registry } from "prom-client";

@Injectable()
export class ReporterPrometheusService {
  private readonly register: Registry;

  public readonly eventStatsLatency: Histogram;
  public readonly revenueStatsLatency: Histogram;
  public readonly demographicsLatency: Histogram;

  constructor() {
    this.register = new Registry();
    collectDefaultMetrics({ register: this.register });

    this.eventStatsLatency = new Histogram({
      name: "reporter_event_stats_latency_seconds",
      help: "Latency for /reports/events",
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.register],
    });

    this.revenueStatsLatency = new Histogram({
      name: "reporter_revenue_stats_latency_seconds",
      help: "Latency for /reports/revenue",
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.register],
    });

    this.demographicsLatency = new Histogram({
      name: "reporter_demographics_latency_seconds",
      help: "Latency for /reports/demographics",
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.register],
    });
  }

  getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}
