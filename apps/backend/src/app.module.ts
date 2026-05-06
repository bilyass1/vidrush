import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { VideoModule } from "./video/video.module";
import { VideoGenerationModule } from "./video-generation/video-generation.module";
import { GatewayModule } from "./gateway/gateway.module";
import { YoutubeModule } from "./youtube/youtube.module";
import { ScriptEngineModule } from "./script-engine/script-engine.module";
import { MusicGenerationModule } from "./music-generation/music-generation.module";
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times: number) => Math.min(times * 500, 5000),
        reconnectOnError: () => true,
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    VideoModule,
    VideoGenerationModule,
    GatewayModule,
    YoutubeModule,
    ScriptEngineModule,
    MusicGenerationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
