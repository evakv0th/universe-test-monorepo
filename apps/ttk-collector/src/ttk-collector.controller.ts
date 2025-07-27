import { SharedCollectorService } from "@app/shared-collector";
import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";
import { TtkCollectorService } from "./ttk-collector.service";

@Controller()
export class TtkCollectorController {
  constructor(
    private readonly ttkCollectorService: TtkCollectorService,
    private readonly sharedCollectorService: SharedCollectorService,
  ) {}

  @Get()
  getHello(): string {
    return this.ttkCollectorService.getHello();
  }

  @Get("/metrics")
  async getMetrics(@Res() res: Response) {
    res.setHeader("Content-Type", "text/plain");
    res.send(await this.sharedCollectorService.getMetrics());
  }
}
