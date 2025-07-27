import { NatsService } from "@app/nats";
import { PrismaService } from "@app/prisma";
import { Module } from "@nestjs/common";
import { PrometheusModule } from "./prometheus/prometheus.module";
import { ReporterController } from "./reporter.controller";
import { ReporterService } from "./reporter.service";

@Module({
  imports: [PrometheusModule],
  controllers: [ReporterController],
  providers: [ReporterService, NatsService, PrismaService],
})
export class ReporterModule {}
