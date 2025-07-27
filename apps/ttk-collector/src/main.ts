import { NestFactory } from "@nestjs/core";
import { TtkCollectorModule } from "./ttk-collector.module";
import { TtkCollectorService } from "./ttk-collector.service";

async function bootstrap() {
  const app = await NestFactory.create(TtkCollectorModule);
  app.get(TtkCollectorService);
  app.enableShutdownHooks();
  await app.listen(3006);
}
bootstrap();
