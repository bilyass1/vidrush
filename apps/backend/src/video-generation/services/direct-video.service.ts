import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { VideoGateway } from '../../gateway/video.gateway';
import { LtxService } from './ltx.service';
import { VideoStatus, VideoType } from '@prisma/client';

export interface DirectGenerateInput {
  videoGenerationId: string;
  userId: string;
  idea: string;
  genre: string;
  aspectRatio: string;
  duration: number; // seconds
  market: string;
}

// Map aspect ratio → LTX dimensions (must be divisible by 32)
const RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 768, height: 432 },
  '9:16': { width: 432, height: 768 },
  '1:1':  { width: 576, height: 576 },
  '4:5':  { width: 512, height: 640 },
};

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-001';

@Injectable()
export class DirectVideoService {
  private readonly logger = new Logger(DirectVideoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly videoGateway: VideoGateway,
    private readonly ltxService: LtxService,
  ) {}

  async generate(input: DirectGenerateInput): Promise<void> {
    const { videoGenerationId: id, userId, idea, genre, aspectRatio, duration, market } = input;

    try {
      // STEP 1 — Expand idea into cinematic LTX prompt via OpenRouter
      await this.emit(id, userId, VideoStatus.SCRIPTING, 10, 'Expanding your idea into a cinematic prompt...');
      const ltxPrompt = await this.expandPrompt(idea, genre, aspectRatio, market);
      this.logger.log(`[direct] Prompt ready: ${ltxPrompt.slice(0, 80)}...`);

      // STEP 2 — Generate video with LTX
      await this.emit(id, userId, VideoStatus.GENERATING, 30, 'Generating video with AI...');

      const dims = RATIO_DIMENSIONS[aspectRatio] ?? RATIO_DIMENSIONS['16:9'];
      // LTX works at 25fps; clamp frames to a reasonable range
      const numFrames = Math.min(Math.max(Math.round(duration * 25), 25), 257);

      this.logger.log(`[direct] LTX params: ${dims.width}x${dims.height}, ${numFrames} frames`);

      const response = await this.ltxService.generateClipWithRetry({
        prompt: ltxPrompt,
        width: dims.width,
        height: dims.height,
        numFrames,
        fps: 25,
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
    if (!apiKey) {
      // Fallback: use the idea directly with style modifiers
      return `${idea}, cinematic ${aspectRatio}, ${genre.toLowerCase()} style, photorealistic, 4K, no text, no watermark`;
    }

    const aspectDesc: Record<string, string> = {
      '16:9': 'widescreen landscape cinematic',
      '9:16': 'vertical portrait mobile-first',
      '1:1':  'square centered composition',
      '4:5':  'portrait slightly vertical',
    };

    const systemPrompt = `You are an expert at writing cinematic video generation prompts for AI video models.
Convert the user's idea into a single rich cinematic prompt (max 200 words).
Rules:
- Describe the visual scene, not the story
- Include: lighting, camera movement, atmosphere, style
- Format: ${aspectDesc[aspectRatio] || 'cinematic'} composition
- Genre feel: ${genre}
- No dialogue, no text overlays, no watermarks
- End with: photorealistic, 4K, no text, no watermark
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
          max_tokens: 300,
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
      return res.data.choices[0].message.content.trim();
    } catch (err: any) {
      this.logger.warn(`OpenRouter prompt expansion failed, using fallback: ${err.message}`);
      return `${idea}, cinematic ${aspectRatio}, ${genre.toLowerCase()} style, photorealistic, 4K, no text, no watermark`;
    }
  }

  private async emit(id: string, userId: string, status: VideoStatus, progress: number, message: string): Promise<void> {
    await this.prisma.videoGeneration.update({ where: { id }, data: { status } });
    this.videoGateway.emitProgress(userId, { videoGenerationId: id, status, progress, message });
  }
}
