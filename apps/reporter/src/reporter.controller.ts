import { Controller, Get, Query } from "@nestjs/common";
import { ReporterPrometheusService } from "./prometheus/prometheus.service";
import { ReporterService } from "./reporter.service";

@Controller()
export class ReporterController {
  constructor(
    private readonly reporterService: ReporterService,
    private readonly prometheusService: ReporterPrometheusService,
  ) {}

  @Get()
  getHello(): string {
    return this.reporterService.getHello();
  }

  @Get("reports/events")
  async getEventStats(@Query() query) {
    const end = this.prometheusService.eventStatsLatency.startTimer();
    const result = await this.reporterService.getEventStats(query);
    end();
    return result;
  }

  @Get("reports/revenue")
  async getRevenue(@Query() query) {
    const end = this.prometheusService.revenueStatsLatency.startTimer();
    const result = await this.reporterService.getRevenueStats(query);
    end();
    return result;
  }

  @Get("reports/demographics")
  async getDemographics(@Query() query) {
    const end = this.prometheusService.demographicsLatency.startTimer();
    const result = await this.reporterService.getDemographics(query);
    end();
    return result;
  }
}
