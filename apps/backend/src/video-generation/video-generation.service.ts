import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { VideoType, VideoStatus, VideoGeneration } from '@prisma/client';
import { GenerateVideoDto } from './dto/generate-video.dto';
import { DirectGenerateDto } from './dto/direct-generate.dto';
import { GeminiService, ScriptPreviewResult } from './services/gemini.service';
import { DirectVideoService } from './services/direct-video.service';

@Injectable()
export class VideoGenerationService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('video-generation') private videoQueue: Queue,
    private geminiService: GeminiService,
    private directVideoService: DirectVideoService,
  ) {}

  async generateScriptPreview(dto: GenerateVideoDto): Promise<ScriptPreviewResult> {
    return this.geminiService.generateScriptPreview(
      dto.topic,
      dto.duration,
      dto.genre,
      dto.aspectRatio,
      dto.market,
    );
  }

  async startGeneration(userId: string, dto: GenerateVideoDto): Promise<{ jobId: string }> {
    const durationMin = dto.duration / 60;

    const videoGeneration = await this.prisma.videoGeneration.create({
      data: {
        userId,
        type: VideoType.YOUTUBE,
        status: VideoStatus.PENDING,
        inputPrompt: dto.topic,
        durationMin,
        pipeline: dto.pipeline ?? 'free',
      },
    });

    await this.videoQueue.add('generate-youtube', {
      videoGenerationId: videoGeneration.id,
      userId,
      ...dto,
    });

    return { jobId: videoGeneration.id };
  }

  async getStatus(jobId: string, userId: string) {
    const generation = await this.prisma.videoGeneration.findFirst({
      where: { id: jobId, userId },
    });

    if (!generation) {
      throw new NotFoundException('Job not found');
    }

    let progress = 0;
    switch (generation.status) {
      case VideoStatus.PENDING: progress = 0; break;
      case VideoStatus.SCRIPTING: progress = 10; break;
      case VideoStatus.VOICING: progress = 30; break;
      case VideoStatus.GENERATING: progress = 60; break;
      case VideoStatus.RENDERING: progress = 80; break;
      case VideoStatus.DONE: progress = 100; break;
      case VideoStatus.FAILED: progress = 0; break;
    }

    return {
      status: generation.status,
      progress,
      outputUrl: generation.outputUrl,
      error: null,
    };
  }

  async getUserVideos(userId: string): Promise<VideoGeneration[]> {
    return this.prisma.videoGeneration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getRecent(userId: string, limit: number): Promise<VideoGeneration[]> {
    return this.prisma.videoGeneration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async startDirectGeneration(userId: string, dto: DirectGenerateDto, file?: Express.Multer.File): Promise<{ jobId: string }> {
    const videoGeneration = await this.prisma.videoGeneration.create({
      data: {
        userId,
        type: VideoType.YOUTUBE,
        status: VideoStatus.PENDING,
        inputPrompt: dto.idea,
        durationMin: dto.duration / 60,
        pipeline: 'free',
      },
    });

    // Run async — don't await so the HTTP response returns immediately
    this.directVideoService.generate({
      videoGenerationId: videoGeneration.id,
      userId,
      idea: dto.idea,
      genre: dto.genre,
      aspectRatio: dto.aspectRatio,
      duration: dto.duration,
      market: dto.market,
      referenceImage: file ? {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
      } : undefined,
      disable_i2v: dto.disable_i2v,
    }).catch(() => { /* errors are handled inside the service */ });

    return { jobId: videoGeneration.id };
  }

  async deleteVideo(id: string, userId: string): Promise<void> {
    const generation = await this.prisma.videoGeneration.findFirst({
      where: { id, userId },
    });

    if (!generation) {
      throw new NotFoundException('Video not found');
    }

    await this.prisma.videoGeneration.update({
      where: { id },
      data: {
        status: VideoStatus.FAILED,
        outputUrl: null,
      },
    });
  }
}
