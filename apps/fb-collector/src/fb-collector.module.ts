import { NatsService } from "@app/nats";
import { PrismaService } from "@app/prisma";
import { SharedCollectorService } from "@app/shared-collector";
import { Module } from "@nestjs/common";
import { FbCollectorController } from "./fb-collector.controller";
import { FbCollectorService } from "./fb-collector.service";

@Module({
  imports: [],
  controllers: [FbCollectorController],
  providers: [
    FbCollectorService,
    NatsService,
    PrismaService,
    {
      provide: SharedCollectorService,
      useFactory: (prisma: PrismaService) => {
        return new SharedCollectorService(prisma, "facebook");
      },
      inject: [PrismaService],
    },
  ],
})
export class FbCollectorModule {}
