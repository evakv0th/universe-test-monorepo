import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";
import { ReporterPrometheusService } from "./prometheus.service";

@Controller("metrics")
export class PrometheusController {
  constructor(private readonly prometheusService: ReporterPrometheusService) {}

  @Get()
  async getMetrics(@Res() res: Response) {
    res.setHeader("Content-Type", "text/plain");
    res.send(await this.prometheusService.getMetrics());
  }
}
