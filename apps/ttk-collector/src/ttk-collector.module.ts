import { NatsService } from "@app/nats";
import { PrismaService } from "@app/prisma";
import { SharedCollectorService } from "@app/shared-collector";
import { Module } from "@nestjs/common";
import { TtkCollectorController } from "./ttk-collector.controller";
import { TtkCollectorService } from "./ttk-collector.service";

@Module({
  imports: [],
  controllers: [TtkCollectorController],
  providers: [
    TtkCollectorService,
    NatsService,
    PrismaService,
    {
      provide: SharedCollectorService,
      useFactory: (prisma: PrismaService) => {
        return new SharedCollectorService(prisma, "tiktok");
      },
      inject: [PrismaService],
    },
  ],
})
export class TtkCollectorModule {}
