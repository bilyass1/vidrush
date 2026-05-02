import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { VideoModule } from '../video/video.module';
import { GatewayModule } from '../gateway/gateway.module';
import { StorageModule } from '../storage/storage.module';
import { GeminiService } from './services/gemini.service';
import { GrokService } from './services/grok.service';
import { ElevenLabsService } from './services/elevenlabs.service';
import { LtxService } from './services/ltx.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { FreePipelineService } from './services/free-pipeline.service';
import { SceneSplitterService } from '../free-pipeline/services/scene-splitter.service';
import { VideoGenerationService } from './video-generation.service';
import { VideoGenerationProcessor } from './video-generation.processor';

import { DirectVideoService } from './services/direct-video.service';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    BullModule.registerQueue({
      name: 'video-generation',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    UsersModule,
    forwardRef(() => VideoModule),
    GatewayModule,
    StorageModule,
  ],
  controllers: [],
  providers: [
    GeminiService,
    GrokService,
    ElevenLabsService,
    LtxService,
    PromptBuilderService,
    SceneSplitterService,
    FreePipelineService,
    VideoGenerationService,
    VideoGenerationProcessor,
    DirectVideoService,
  ],
  exports: [VideoGenerationService, ElevenLabsService, LtxService, DirectVideoService],
})
export class VideoGenerationModule {}
