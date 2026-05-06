import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { VideoGateway } from '../../gateway/video.gateway';
import { LtxService } from './ltx.service';
import { VideoStatus, VideoType } from '@prisma/client';
import { ASPECT_RATIO_PRESETS, VIDEO_CONSTRAINTS } from '../config/video-constraints.config';
import { PromptBuilderService } from './prompt-builder.service';

export interface DirectGenerateInput {
  videoGenerationId: string;
  userId: string;
  idea: string;
  genre: string;
  aspectRatio: string;
  duration: number; // seconds
  market: string;
  referenceImage?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  };
  disable_i2v?: boolean;
}

// Map aspect ratio → LTX dimensions (imported from config)
const RATIO_DIMENSIONS = ASPECT_RATIO_PRESETS;

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-001';

@Injectable()
export class DirectVideoService {
  private readonly logger = new Logger(DirectVideoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly videoGateway: VideoGateway,
    private readonly ltxService: LtxService,
    private readonly promptBuilder: PromptBuilderService,
  ) {}

  async generate(input: DirectGenerateInput): Promise<void> {
    const { videoGenerationId: id, userId, idea, genre, aspectRatio, duration, market, referenceImage, disable_i2v } = input;

    try {
      // STEP 1 — Expand idea into cinematic LTX prompt via OpenRouter
      await this.emit(id, userId, VideoStatus.SCRIPTING, 10, 'Expanding your idea into a cinematic prompt...');
      const ltxPrompt = await this.expandPrompt(idea, genre, aspectRatio, market);
      this.logger.log(`[direct] Prompt ready: ${ltxPrompt.slice(0, 80)}...`);

      // STEP 2 — Generate video with LTX
      await this.emit(id, userId, VideoStatus.GENERATING, 30, 'Generating video with AI...');

      const dims = RATIO_DIMENSIONS[aspectRatio] ?? RATIO_DIMENSIONS['16:9'];
      
      // Apply constraints from centralized configuration
      const constrainedDuration = Math.min(duration, VIDEO_CONSTRAINTS.MAX_DURATION);
      const fps = Math.min(VIDEO_CONSTRAINTS.DEFAULT_FPS, VIDEO_CONSTRAINTS.MAX_FPS);
      
      this.logger.log(`[direct] LTX params: ${dims.width}x${dims.height}, ${constrainedDuration}s @ ${fps}fps`);

      // Convert reference image to base64 if provided
      let firstFrameBase64: string | null = null;
      if (referenceImage && !disable_i2v) {
        firstFrameBase64 = referenceImage.buffer.toString('base64');
        this.logger.log(`[direct] Using reference image: ${referenceImage.originalname}`);
      }

      const response = await this.ltxService.generateClipWithRetry({
        prompt: ltxPrompt,
        width: dims.width,
        height: dims.height,
        duration: constrainedDuration,
        fps,
        firstFrameBase64,
      });

      // STEP 3 — Save directly as DONE (URL is already the ComfyUI view URL)
      await this.emit(id, userId, VideoStatus.RENDERING, 90, 'Finalizing...');

      const durationMin = duration / 60;
      await this.prisma.videoGeneration.update({
        where: { id },
        data: {
          status: VideoStatus.DONE,
          outputUrl: response.videoPath,
          durationMin,
        },
      });

      this.videoGateway.emitProgress(userId, {
        videoGenerationId: id,
        status: VideoStatus.DONE,
        progress: 100,
        message: 'Your video is ready!',
        outputUrl: response.videoPath,
      });

      this.logger.log(`[direct] Job ${id} DONE — ${response.videoPath}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`[direct] Job ${id} failed: ${message}`);

      await this.prisma.videoGeneration.update({
        where: { id },
        data: { status: VideoStatus.FAILED },
      });

      this.videoGateway.emitProgress(userId, {
        videoGenerationId: id,
        status: VideoStatus.FAILED,
        progress: 0,
        message: `Generation failed: ${message}`,
      });

      throw err;
    }
  }

  private async expandPrompt(idea: string, genre: string, aspectRatio: string, market: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // If no API key, use the genre-based prompt builder directly
    if (!apiKey) {
      const fallbackPrompt = `${idea}, cinematic ${aspectRatio}, ${genre.toLowerCase()} style, photorealistic, 4K, no text, no watermark`;
      return this.promptBuilder.buildPromptWithGenre(genre, fallbackPrompt);
    }

    const aspectDesc: Record<string, string> = {
      '16:9': 'widescreen landscape cinematic',
      '9:16': 'vertical portrait mobile-first',
      '1:1':  'square centered composition',
      '4:5':  'portrait slightly vertical',
    };

    const systemPrompt = `You are an expert at writing cinematic video generation prompts for AI video models.
Convert the user's idea into a single rich cinematic prompt (max 150 words) that describes the visual scene.
Rules:
- Describe the visual scene, not the story
- Include: lighting, camera movement, atmosphere, style
- Format: ${aspectDesc[aspectRatio] || 'cinematic'} composition
- Genre feel: ${genre}
- No dialogue, no text overlays, no watermarks
- End with: photorealistic, 8K, no text, no watermark
- Return ONLY the prompt, nothing else`;

    try {
      const res = await axios.post(
        OPENROUTER_URL,
        {
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: idea },
          ],
          temperature: 0.7,
          max_tokens: 250,
        },
        {
          timeout: 30000,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://vidrush.app',
            'X-Title': 'VidRush',
          },
        },
      );
      
      const expandedPrompt = res.data.choices[0].message.content.trim();
      // Apply genre styling to the expanded prompt
      return this.promptBuilder.buildPromptWithGenre(genre, expandedPrompt);
    } catch (err: any) {
      this.logger.warn(`OpenRouter prompt expansion failed, using fallback: ${err.message}`);
      const fallbackPrompt = `${idea}, cinematic ${aspectRatio}, ${genre.toLowerCase()} style, photorealistic, 4K, no text, no watermark`;
      return this.promptBuilder.buildPromptWithGenre(genre, fallbackPrompt);
    }
  }

  private async emit(id: string, userId: string, status: VideoStatus, progress: number, message: string): Promise<void> {
    await this.prisma.videoGeneration.update({ where: { id }, data: { status } });
    this.videoGateway.emitProgress(userId, { videoGenerationId: id, status, progress, message });
  }
}
