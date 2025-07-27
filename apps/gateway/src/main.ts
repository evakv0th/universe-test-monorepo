import { NestFactory } from "@nestjs/core";
import { json, urlencoded } from "express";
import { GatewayModule } from "./gateway.module";

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  app.enableShutdownHooks();
  app.use(json({ limit: "50mb" }));
  app.use(urlencoded({ extended: true, limit: "50mb" }));

  await app.listen(3000);
}
bootstrap();
