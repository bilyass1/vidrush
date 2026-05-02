import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PrismaService } from '../../prisma/prisma.service';
import { VideoGateway } from '../../gateway/video.gateway';
import { GeminiService } from './gemini.service';
import { ElevenLabsService } from './elevenlabs.service';
import { LocalStorageService } from '../../storage/local-storage.service';
import { SceneSplitterService } from '../../free-pipeline/services/scene-splitter.service';
import { LtxService } from './ltx.service';
import { PromptBuilderService } from './prompt-builder.service';
import { VideoStatus } from '@prisma/client';

export interface FreePipelineInput {
  videoGenerationId: string;
  userId: string;
  topic: string;
  duration: number;
  genre: string;
  market: string;
}

interface AssemblyInstructions {
  scenes: {
    footage_path: string;
    start_sec: number;
    duration_sec: number;
    sfx_path: string | null;
    sfx_volume: number;
    transition: string;
    caption?: string;
  }[];
  voice_path: string;
  music_paths: string[];
  output_path: string;
  total_duration: number;
  style: string;
}

@Injectable()
export class FreePipelineService {
  private readonly logger = new Logger(FreePipelineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly elevenlabs: ElevenLabsService,
    private readonly storage: LocalStorageService,
    private readonly videoGateway: VideoGateway,
    private readonly sceneSplitter: SceneSplitterService,
    private readonly ltxService: LtxService,
    private readonly promptBuilder: PromptBuilderService,
  ) {}

  async generate(input: FreePipelineInput): Promise<void> {
    const { videoGenerationId: id, userId, topic, duration, genre, market } = input;
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
      await this.emit(id, userId, VideoStatus.SCRIPTING, 10, 'Writing script...');
      const script = await this.gemini.generateScript(topic, durationMin, genre, market);
      this.logger.log(`[free] Script ready for ${id} (${script.length} chars)`);

      // STEP 2 — SCENE SPLITTING
      await this.emit(id, userId, VideoStatus.SCRIPTING, 15, 'Splitting into scenes...');
      const scenes = await this.sceneSplitter.splitIntoScenes(script, durationMin, genre);
      this.logger.log(`[free] ${scenes.length} scenes split`);

      // STEP 3 — VOICING
      await this.emit(id, userId, VideoStatus.VOICING, 25, 'Generating voiceover...');
      const audioUrl = await this.elevenlabs.generateVoice(script, 'JBFqnCBsd6RMkjVDRZzb', userId, id);
      const voicePath = this.resolveLocalUrl(audioUrl);
      this.logger.log(`[free] Audio saved: ${audioUrl}`);

      // STEP 4 — VIDEO CLIP GENERATION (25% → 70%)
      await this.emit(id, userId, VideoStatus.GENERATING, 25, 'Generating video clips with AI...');

      let lastFrameBase64: string | null = null;
      const footagePaths: string[] = [];

      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        const basePrompt = this.promptBuilder.buildScenePrompt(scene, genre, i, scenes.length);
        const finalPrompt = i === 0
          ? basePrompt
          : this.promptBuilder.buildContinuationPrompt(scene, genre, basePrompt);

        this.logger.log(`[free] Generating clip ${i + 1}/${scenes.length}...`);
        this.videoGateway.emitProgress(userId, {
          videoGenerationId: id,
          status: VideoStatus.GENERATING,
          progress: 25,
          message: `Generating clip ${i + 1}/${scenes.length}...`,
        });

        const response = await this.ltxService.generateClipWithRetry({
          prompt: finalPrompt,
          width: 768,
          height: 432,
          numFrames: Math.round(scene.durationSec * 24),
          fps: 24,
          numInferenceSteps: 30,
          guidanceScale: 7.5,
          firstFrameBase64: lastFrameBase64,
        });

        // Download the video from ComfyUI URL to a local file for assembly
        const clipPath = path.join(clipsDir, `clip_${i}.mp4`);
        await this.downloadUrl(response.videoPath, clipPath);

        lastFrameBase64 = response.lastFrameBase64;
        footagePaths.push(clipPath);

        const progress = 25 + Math.round(((i + 1) / scenes.length) * 45);
        await this.emit(id, userId, VideoStatus.GENERATING, progress, `Clip ${i + 1}/${scenes.length} ready`);
      }

      // STEP 5 — ASSEMBLE via Tauri local server
      await this.emit(id, userId, VideoStatus.RENDERING, 75, 'Assembling video...');
      const outputPath = path.join(outputDir, 'final.mp4');

      const instructions: AssemblyInstructions = {
        scenes: scenes.map((scene, i) => ({
          footage_path: footagePaths[i],
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
      };

      const assemblyRes = await axios.post<{ output_path: string; error?: string }>(
        'http://localhost:1422/assemble',
        instructions,
        { timeout: 10 * 60 * 1000 },
      ).catch((err: unknown) => {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        const detail = axiosErr?.response?.data?.error;
        throw new Error(`Assembly failed: ${detail ?? (err as Error).message}`);
      });

      const finalLocalPath = assemblyRes.data.output_path;
      this.logger.log(`[free] Assembly complete: ${finalLocalPath}`);

      // STEP 6 — Save & mark DONE
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
      this.logger.log(`[free] Job ${id} DONE — ${finalUrl}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`[free] Job ${id} failed: ${message}`);
      throw err;
    } finally {
      fs.rm(tempDir, { recursive: true, force: true }, () => {});
    }
  }

  private async downloadUrl(url: string, destPath: string): Promise<void> {
    const response = await axios.get(url, { responseType: 'stream', timeout: 120000 });
    await new Promise<void>((resolve, reject) => {
      const writer = fs.createWriteStream(destPath);
      (response.data as NodeJS.ReadableStream).pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  private resolveLocalUrl(url: string): string {
    const uploadsDir = process.env.LOCAL_STORAGE_PATH
      ? path.resolve(process.env.LOCAL_STORAGE_PATH)
      : path.join(process.cwd(), 'uploads');
    const relative = url.replace(/^https?:\/\/[^/]+\/uploads\//, '');
    return path.join(uploadsDir, relative);
  }

  private async emit(
    id: string,
    userId: string,
    status: VideoStatus,
    progress: number,
    message: string,
  ): Promise<void> {
    await this.prisma.videoGeneration.update({ where: { id }, data: { status } });
    this.videoGateway.emitProgress(userId, { videoGenerationId: id, status, progress, message });
  }
}
