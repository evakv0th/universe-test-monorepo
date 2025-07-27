import { NatsService } from "@app/nats";
import { Module } from "@nestjs/common";
import { GatewayController } from "./gateway.controller";
import { GatewayService } from "./gateway.service";
import { PrometheusModule } from "./prometheus/prometheus.module";

@Module({
  imports: [PrometheusModule, GatewayModule],
  controllers: [GatewayController],
  providers: [GatewayService, NatsService],
})
export class GatewayModule {
  constructor(private readonly natsService: NatsService) {}

  async onModuleInit() {
    await this.natsService.connect();
  }
}
