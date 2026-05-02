import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { VideoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GrokService } from './services/grok.service';
import { ElevenLabsService } from './services/elevenlabs.service';
import { LtxService } from './services/ltx.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { FreePipelineService } from './services/free-pipeline.service';
import { VideoGateway } from '../gateway/video.gateway';
import { SceneSplitterService } from '../free-pipeline/services/scene-splitter.service';
import { LocalStorageService } from '../storage/local-storage.service';
import axios from 'axios';

export interface GenerateYoutubeJobData {
  videoGenerationId: string;
  userId: string;
  topic: string;
  duration: number;
  genre: string;
  aspectRatio: string;
  market: string;
  pipeline: 'free' | 'premium';
}

const VOICE_ID_MAP: Record<string, string> = {
  Documentary:    'pNInz6obpgDQGcFmaJgB',
  'Dark History': 'VR6AewLTigWG4xSOukaG',
  'True Crime':   'ErXwobaYiN019PkySvjV',
  Educational:    'MF3mGyEYCl7XYWbV9V6O',
  Funny:          'EXAVITQu4vr4xnSDxMaL',
  History:        'pNInz6obpgDQGcFmaJgB',
  Horror:         'ErXwobaYiN019PkySvjV',
  Science:        'EXAVITQu4vr4xnSDxMaL',
  News:           'pNInz6obpgDQGcFmaJgB',
  Motivation:     'AZnzlk1XvdvUeBnXmlld',
};

@Processor('video-generation')
export class VideoGenerationProcessor {
  private readonly logger = new Logger(VideoGenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly grokService: GrokService,
    private readonly elevenLabsService: ElevenLabsService,
    private readonly ltxService: LtxService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly sceneSplitter: SceneSplitterService,
    private readonly freePipelineService: FreePipelineService,
    private readonly storage: LocalStorageService,
    private readonly videoGateway: VideoGateway,
  ) {}

  @Process('generate-youtube')
  async processYoutube(job: Job<GenerateYoutubeJobData>): Promise<void> {
    const { videoGenerationId, userId, pipeline } = job.data;

    try {
      if (pipeline === 'free') {
        await this.freePipelineService.generate({
          videoGenerationId,
          userId,
          topic: job.data.topic,
          duration: job.data.duration,
          genre: job.data.genre,
          market: job.data.market,
        });
      } else {
        await this.runPremiumPipeline(job);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Job ${videoGenerationId} failed: ${message}`);
      await this.updateStatus(videoGenerationId, userId, VideoStatus.FAILED, 0);
      await this.prisma.videoGeneration.update({
        where: { id: videoGenerationId },
        data: { status: VideoStatus.FAILED },
      });
      throw error;
    }
  }

  private async runPremiumPipeline(job: Job<GenerateYoutubeJobData>): Promise<void> {
    const { videoGenerationId: id, userId, topic, duration, genre } = job.data;
    const durationMin = Math.max(1, Math.round(duration / 60));

    const tempDir = path.join(os.tmpdir(), 'vidrush', id);
    const clipsDir = path.join(tempDir, 'clips');
    const audioDir = path.join(tempDir, 'audio');
    const outputDir = path.join(tempDir, 'output');

    try {
      fs.mkdirSync(clipsDir, { recursive: true });
      fs.mkdirSync(audioDir, { recursive: true });
      fs.mkdirSync(outputDir, { recursive: true });

      // STEP 1 — SCRIPTING
      await this.updateStatus(id, userId, VideoStatus.SCRIPTING, 10, 'Writing script with AI...');
      const script = await this.grokService.generateScript(topic, durationMin, genre);
      this.logger.log(`[premium] Script ready for ${id} (${script.length} chars)`);

      // STEP 2 — VOICING
      await this.updateStatus(id, userId, VideoStatus.VOICING, 25, 'Generating voiceover...');
      const voiceId = VOICE_ID_MAP[genre] ?? VOICE_ID_MAP['Documentary'];
      const audioUrl = await this.elevenLabsService.generateVoice(script, voiceId, userId, id);
      const voicePath = this.resolveLocalUrl(audioUrl);
      this.logger.log(`[premium] Audio saved: ${audioUrl}`);

      // STEP 3 — GENERATING CLIPS WITH LTX
      await this.updateStatus(id, userId, VideoStatus.GENERATING, 50, 'Generating AI video clips...');
      const scenes = await this.sceneSplitter.splitIntoScenes(script, durationMin, genre);

      const clipPaths: string[] = [];
      let lastFrameBase64: string | null = null;

      for (let i = 0; i < scenes.length; i++) {
        const basePrompt = this.promptBuilder.buildScenePrompt(scenes[i], genre, i, scenes.length);
        const finalPrompt = i === 0
          ? basePrompt
          : this.promptBuilder.buildContinuationPrompt(scenes[i], genre, basePrompt);

        const response = await this.ltxService.generateClipWithRetry({
          prompt: finalPrompt,
          numFrames: Math.round(scenes[i].durationSec * 24),
          firstFrameBase64: lastFrameBase64,
        });

        // Download the video from ComfyUI URL to a local file for assembly
        const clipPath = path.join(clipsDir, `clip_${i}.mp4`);
        const clipStream = await axios.get(response.videoPath, { responseType: 'stream', timeout: 120000 });
        await new Promise<void>((resolve, reject) => {
          const writer = fs.createWriteStream(clipPath);
          (clipStream.data as NodeJS.ReadableStream).pipe(writer);
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        lastFrameBase64 = response.lastFrameBase64;
        clipPaths.push(clipPath);

        const progress = 50 + Math.round(((i + 1) / scenes.length) * 25);
        this.videoGateway.emitProgress(userId, {
          videoGenerationId: id,
          status: VideoStatus.GENERATING,
          progress,
          message: `Clip ${i + 1}/${scenes.length} generated`,
        });
      }

      // STEP 4 — ASSEMBLY with local FFmpeg
      await this.updateStatus(id, userId, VideoStatus.RENDERING, 75, 'Assembling final video...');
      const outputPath = path.join(outputDir, 'final.mp4');

      const assemblyRes = await axios.post<{ output_path: string; error?: string }>(
        'http://localhost:1422/assemble',
        {
          scenes: scenes.map((scene, i) => ({
            footage_path: clipPaths[i],
            start_sec: 0,
            duration_sec: scene.durationSec,
            sfx_path: null,
            sfx_volume: 0,
            transition: i === 0 ? 'cut' : 'fade',
            caption: scene.text.trim().slice(0, 200),
          })),
          voice_path: voicePath,
          music_paths: [],
          output_path: outputPath,
          total_duration: durationMin * 60,
          style: genre,
        },
        { timeout: 10 * 60 * 1000 },
      ).catch((err: unknown) => {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        const detail = axiosErr?.response?.data?.error;
        throw new Error(`Assembly failed: ${detail ?? (err as Error).message}`);
      });

      const finalLocalPath = assemblyRes.data.output_path;

      // STEP 5 — DONE
      const fileBuffer = await fs.promises.readFile(finalLocalPath);
      const finalUrl = await this.storage.saveBuffer(fileBuffer, `final/${userId}/${id}/output.mp4`);

      await this.prisma.videoGeneration.update({
        where: { id },
        data: { status: VideoStatus.DONE, outputUrl: finalUrl, durationMin },
      });
      this.videoGateway.emitProgress(userId, {
        videoGenerationId: id,
        status: VideoStatus.DONE,
        progress: 100,
        message: 'Your video is ready!',
        outputUrl: finalUrl,
      });
      this.logger.log(`[premium] Job ${id} DONE — ${finalUrl}`);
    } finally {
      fs.rm(tempDir, { recursive: true, force: true }, () => {});
    }
  }

  private resolveLocalUrl(url: string): string {
    const uploadsDir = process.env.LOCAL_STORAGE_PATH
      ? path.resolve(process.env.LOCAL_STORAGE_PATH)
      : path.join(process.cwd(), 'uploads');
    const relative = url.replace(/^https?:\/\/[^/]+\/uploads\//, '');
    return path.join(uploadsDir, relative);
  }

  private async updateStatus(
    id: string,
    userId: string,
    status: VideoStatus,
    progress: number,
    message?: string,
  ): Promise<void> {
    await this.prisma.videoGeneration.update({ where: { id }, data: { status } });
    this.videoGateway.emitProgress(userId, {
      videoGenerationId: id,
      status,
      progress,
      message: message ?? this.videoGateway.getMessageForStatus(status),
    });
  }
}
