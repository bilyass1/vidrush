import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { GatewayModule } from '../gateway/gateway.module';
import { GeminiService } from '../video-generation/services/gemini.service';
import { ElevenLabsService } from '../video-generation/services/elevenlabs.service';
import { LocalStorageService } from '../storage/local-storage.service';
import { SceneSplitterService } from './services/scene-splitter.service';
import { AudioService } from './services/audio.service';

// Free pipeline module - provides scene splitting and audio services
@Module({
  imports: [PrismaModule, HttpModule, GatewayModule],
  providers: [SceneSplitterService, AudioService, GeminiService, ElevenLabsService, LocalStorageService],
  exports: [SceneSplitterService, AudioService],
})
export class FreePipelineModule { }
