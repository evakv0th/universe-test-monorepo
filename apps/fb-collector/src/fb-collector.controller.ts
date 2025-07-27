import { SharedCollectorService } from "@app/shared-collector";
import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";
import { FbCollectorService } from "./fb-collector.service";

@Controller()
export class FbCollectorController {
  constructor(
    private readonly fbCollectorService: FbCollectorService,
    private readonly sharedCollectorService: SharedCollectorService,
  ) {}

  @Get()
  getHello(): string {
    return "fbCollector is running!";
  }

  @Get("/metrics")
  async getMetrics(@Res() res: Response) {
    res.setHeader("Content-Type", "text/plain");
    res.send(await this.sharedCollectorService.getMetrics());
  }
}
