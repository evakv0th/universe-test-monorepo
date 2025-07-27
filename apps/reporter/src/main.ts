import { NestFactory } from "@nestjs/core";
import { ReporterModule } from "./reporter.module";

async function bootstrap() {
  const app = await NestFactory.create(ReporterModule);
  app.enableShutdownHooks();
  await app.listen(3007);
}
bootstrap();
