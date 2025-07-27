import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from "@nestjs/common";
import { GatewayService } from "./gateway.service";
import { PrometheusService } from "./prometheus/prometheus.service";

@Controller()
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly prometheusService: PrometheusService,
  ) {}

  @Get()
  getHello(): string {
    return this.gatewayService.getHello();
  }

  @Post("events")
  @HttpCode(HttpStatus.OK)
  async handleIncomingEvents(@Body() events: any): Promise<string> {
    return this.gatewayService.processIncomingEvents(events);
  }
}
