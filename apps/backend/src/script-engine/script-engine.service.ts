import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { LtxService } from '../video-generation/services/ltx.service';
import { VideoGateway } from '../gateway/video.gateway';
import { GenerateScriptDto } from './dto/generate-script.dto';
import { ScriptResult, VideoJob } from './interfaces/script-result.interface';
import { VideoStatus } from '@prisma/client';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_MODEL = 'google/gemini-2.0-flash-001';

const RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 768, height: 432 },
  '9:16': { width: 432, height: 768 },
  '1:1':  { width: 576, height: 576 },
};

const LANGUAGE_LABELS: Record<string, string> = {
  'en-us': 'US English',
  'en-uk': 'UK English',
  'fr': 'French',
  'ar': 'Arabic',
};

@Injectable()
export class ScriptEngineService {
  private readonly logger = new Logger(ScriptEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ltxService: LtxService,
    private readonly videoGateway: VideoGateway,
  ) {}

  async generateScriptAndPrompts(dto: GenerateScriptDto): Promise<ScriptResult> {
    const script = await this.callGemini(dto);
    return script;
  }

  async generateVideoDirectly(userId: string, dto: GenerateScriptDto): Promise<VideoJob> {
    // Create DB record
    const project = await this.prisma.scriptProject.create({
      data: {
        userId,
        idea: dto.idea,
        genre: dto.genre,
        aspectRatio: dto.aspectRatio,
        language: dto.language,
        durationSeconds: dto.durationSeconds,
        voiceId: dto.voiceId,
        generationMode: dto.generationMode === 'premium' ? 'PREMIUM' : 'FREE',
        status: 'PENDING',
      },
    });

    // Fire-and-forget
    this.runGenerationPipeline(userId, project.id, dto).catch((err) => {
      this.logger.error(`Pipeline failed for project ${project.id}: ${err.message}`);
    });

    return { jobId: project.id, scriptProjectId: project.id, status: 'PENDING' };
  }

  private async runGenerationPipeline(
    userId: string,
    projectId: string,
    dto: GenerateScriptDto,
  ): Promise<void> {
    try {
      // Step 1 — Generate script with Gemini
      await this.updateStatus(projectId, userId, 'GENERATING', 10, 'Gemini développe votre idée en script cinématique...');
      const script = await this.callGemini(dto);

      this.logger.log(`[script-engine] Script generated: ${script.title} (${script.scenes.length} scenes, ${script.total_words} words)`);

      await this.prisma.scriptProject.update({
        where: { id: projectId },
        data: { scriptJson: script as any, status: 'GENERATING' },
      });

      this.videoGateway.emitProgress(userId, {
        videoGenerationId: projectId,
        status: VideoStatus.SCRIPTING,
        progress: 40,
        message: `Script prêt: "${script.title}" — génération de la première scène...`,
      });

      // Step 2 — Trigger LTX for first scene
      const firstScene = script.scenes[0];
      if (!firstScene) throw new Error('No scenes in generated script');

      const dims = RATIO_DIMENSIONS[dto.aspectRatio] ?? RATIO_DIMENSIONS['16:9'];
      const numFrames = Math.min(Math.max(Math.round(firstScene.duration_seconds * 25), 25), 257);

      this.logger.log(`[script-engine] Generating video with LTX: ${dims.width}x${dims.height}, ${numFrames} frames`);
      this.logger.log(`[script-engine] Positive prompt: ${firstScene.positive_prompt.slice(0, 100)}...`);
      this.logger.log(`[script-engine] Negative prompt: ${firstScene.negative_prompt.slice(0, 100)}...`);

      const response = await this.ltxService.generateClipWithRetry({
        prompt: firstScene.positive_prompt,
        negativePrompt: firstScene.negative_prompt,
        width: dims.width,
        height: dims.height,
        numFrames,
        fps: 25,
      });

      await this.prisma.scriptProject.update({
        where: { id: projectId },
        data: { status: 'DONE', videoJobId: response.videoPath },
      });

      this.videoGateway.emitProgress(userId, {
        videoGenerationId: projectId,
        status: VideoStatus.DONE,
        progress: 100,
        message: 'Your video is ready!',
        outputUrl: response.videoPath,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`[script-engine] Project ${projectId} failed: ${message}`);

      await this.prisma.scriptProject.update({
        where: { id: projectId },
        data: { status: 'FAILED' },
      });

      this.videoGateway.emitProgress(userId, {
        videoGenerationId: projectId,
        status: VideoStatus.FAILED,
        progress: 0,
        message: `Generation failed: ${message}`,
      });
    }
  }

  private async callGemini(dto: GenerateScriptDto): Promise<ScriptResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new BadRequestException('Gemini API key not configured (use GEMINI_API_KEY from OpenRouter)');

    const systemPrompt = `You are a cinematic video prompt engineer for LTX 2.3 (ComfyUI). Given a video idea, genre, aspect ratio, language, and duration, generate:
A full video script with hook, 3-5 scenes, and loop ending.
For each scene generate a POSITIVE and NEGATIVE prompt following this architecture:
POSITIVE (layers in order, comma-separated, ≤80 words): Subject · Action · Camera (shot size + angle + movement) · Environment · Lighting · Style/Quality · Motion/Physics · Texture/Detail · Audio cue
NEGATIVE (≤40 words): Artifact (blur, noise, glitch) · Style ban (cartoon, CGI, anime) · Anatomy (deformed, extra limbs) · Quality (low-res) · Motion (frozen, jitter) · Temporal (flicker) · Text/UI (watermark) · Lighting (overlit)
Return ONLY valid JSON, no markdown, no explanation:
{
  "title": "string",
  "hook": "string (≤15 words, grabbing opening line)",
  "scenes": [
    {
      "scene_number": 1,
      "narration": "string",
      "duration_seconds": number,
      "positive_prompt": "string",
      "negative_prompt": "string"
    }
  ],
  "loop_ending": "string",
  "total_words": number,
  "estimated_duration_seconds": number
}`;

    const userMessage = `Idea: ${dto.idea}
Genre: ${dto.genre}
Aspect Ratio: ${dto.aspectRatio}
Language: ${LANGUAGE_LABELS[dto.language] ?? dto.language}
Target Duration: ${dto.durationSeconds} seconds`;

    const res = await axios.post(
      OPENROUTER_API_URL,
      {
        model: GEMINI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      },
      {
        timeout: 60000,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://vidrush.app',
          'X-Title': 'VidRush',
        },
      },
    );

    const raw = res.data.choices?.[0]?.message?.content ?? '';
    try {
      return JSON.parse(raw) as ScriptResult;
    } catch {
      // Try to extract JSON from the response if it has extra text
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as ScriptResult;
      throw new Error('Gemini returned invalid JSON');
    }
  }

  async getProjectStatus(projectId: string, userId: string) {
    const project = await this.prisma.scriptProject.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new BadRequestException('Project not found');
    return {
      status: project.status,
      scriptJson: project.scriptJson,
      videoJobId: project.videoJobId,
    };
  }

  private async updateStatus(
    projectId: string,
    userId: string,
    status: string,
    progress: number,
    message: string,
  ) {
    await this.prisma.scriptProject.update({
      where: { id: projectId },
      data: { status: status as any },
    });
    this.videoGateway.emitProgress(userId, {
      videoGenerationId: projectId,
      status: VideoStatus.GENERATING,
      progress,
      message,
    });
  }
}
