import { NestFactory } from "@nestjs/core";
import { FbCollectorModule } from "./fb-collector.module";
import { FbCollectorService } from "./fb-collector.service";

async function bootstrap() {
  const app = await NestFactory.create(FbCollectorModule);
  app.get(FbCollectorService);
  app.enableShutdownHooks();

  await app.listen(3005);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
