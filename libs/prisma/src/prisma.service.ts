import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    let retries = 5;
    while (retries) {
      try {
        await this.$connect();
        console.log(" TEST Database connected");
        break;
      } catch (err) {
        retries--;
        console.warn(
          " TEST Database not ready, retrying in 3s...",
          err.message,
        );
        await new Promise((res) => setTimeout(res, 3000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
