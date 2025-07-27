import { Module } from "@nestjs/common";
import { PrometheusController } from "./prometheus.controller";
import { ReporterPrometheusService } from "./prometheus.service";

@Module({
  controllers: [PrometheusController],
  providers: [ReporterPrometheusService],
  exports: [ReporterPrometheusService],
})
export class PrometheusModule {}
