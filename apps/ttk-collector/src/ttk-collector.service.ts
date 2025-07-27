import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class TtkCollectorService {
  private readonly logger = new Logger(TtkCollectorService.name);

  constructor() {}

  getHello(): string {
    return "Ttk Collector is up!";
  }
}
