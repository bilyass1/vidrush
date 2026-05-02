import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScriptEngineController } from './script-engine.controller';
import { ScriptEngineService } from './script-engine.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GatewayModule } from '../gateway/gateway.module';
import { VideoGenerationModule } from '../video-generation/video-generation.module';

@Module({
  imports: [PrismaModule, HttpModule, GatewayModule, VideoGenerationModule],
  controllers: [ScriptEngineController],
  providers: [ScriptEngineService],
})
export class ScriptEngineModule {}
