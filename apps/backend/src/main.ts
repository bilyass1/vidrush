import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { IoAdapter } from "@nestjs/platform-socket.io";
import * as path from "path";
import * as fs from "fs";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  app.setGlobalPrefix("api");
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serve locally generated audio/video files (desktop — no S3)
  const uploadsDir = process.env.LOCAL_STORAGE_PATH
    ? path.resolve(process.env.LOCAL_STORAGE_PATH)
    : path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: "/uploads" });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}

bootstrap();
