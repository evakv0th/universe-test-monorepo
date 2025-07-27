import { Injectable } from "@nestjs/common";

@Injectable()
export class FbCollectorService {
  constructor() {}

  getHello(): string {
    return "FB Collector is up";
  }
}
