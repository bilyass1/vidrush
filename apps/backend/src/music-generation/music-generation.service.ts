import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { VideoGateway } from '../gateway/video.gateway';
import { GenerateMusicDto } from './dto/generate-music.dto';
import { MusicJob } from './interfaces/music-result.interface';
import { VideoStatus } from '@prisma/client';

@Injectable()
export class MusicGenerationService {
  private readonly logger = new Logger(MusicGenerationService.name);
  private readonly comfyuiUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly videoGateway: VideoGateway,
  ) {
    this.comfyuiUrl = process.env.LTX_SERVER_URL || 'https://vault-folk-delivery-illustration.trycloudflare.com';
  }

  async generateMusic(userId: string, dto: GenerateMusicDto): Promise<MusicJob> {
    // Create DB record
    const project = await this.prisma.musicProject.create({
      data: {
        userId,
        prompt: dto.prompt,
        lyrics: dto.lyrics,
        seed: dto.seed ?? Math.floor(Math.random() * 999999),
        steps: dto.steps ?? 8,
        cfg: dto.cfg ?? 1,
        shift: dto.shift ?? 3,
        duration: dto.duration ?? 120,
        bpm: dto.bpm ?? 190,
        timeSignature: dto.timeSignature ?? '4',
        language: dto.language ?? 'en',
        keyScale: dto.keyScale ?? 'E minor',
        cfgScale: dto.cfgScale ?? 2,
        temperature: dto.temperature ?? 0.85,
        topP: dto.topP ?? 0.9,
        topK: dto.topK ?? 0,
        minP: dto.minP ?? 0,
        status: 'PENDING',
      },
    });

    // Fire-and-forget generation
    this.runMusicGeneration(userId, project.id, dto).catch((err) => {
      this.logger.error(`Music generation failed for project ${project.id}: ${err.message}`);
    });

    return { 
      jobId: project.id, 
      musicProjectId: project.id, 
      status: 'PENDING' 
    };
  }

  private async runMusicGeneration(
    userId: string,
    projectId: string,
    dto: GenerateMusicDto,
  ): Promise<void> {
    try {
      await this.updateStatus(projectId, userId, 'GENERATING', 10, 'Preparing music generation...');

      const seed = dto.seed ?? Math.floor(Math.random() * 999999);
      const steps = dto.steps ?? 8;
      const cfg = dto.cfg ?? 1;
      const shift = dto.shift ?? 3;
      const duration = dto.duration ?? 120;
      const bpm = dto.bpm ?? 190;
      const timeSignature = dto.timeSignature ?? '4';
      const language = dto.language ?? 'en';
      const keyScale = dto.keyScale ?? 'E minor';
      const cfgScale = dto.cfgScale ?? 2;
      const temperature = dto.temperature ?? 0.85;
      const topP = dto.topP ?? 0.9;
      const topK = dto.topK ?? 0;
      const minP = dto.minP ?? 0;

      // Build ComfyUI workflow
      const workflow = {
        "3": {
          "inputs": {
            "seed": seed,
            "steps": steps,
            "cfg": cfg,
            "sampler_name": "euler",
            "scheduler": "simple",
            "denoise": 1,
            "model": ["78", 0],
            "positive": ["94", 0],
            "negative": ["47", 0],
            "latent_image": ["98", 0]
          },
          "class_type": "KSampler",
          "_meta": { "title": "KSampler" }
        },
        "18": {
          "inputs": {
            "samples": ["3", 0],
            "vae": ["97", 2]
          },
          "class_type": "VAEDecodeAudio",
          "_meta": { "title": "VAEDecodeAudio" }
        },
        "47": {
          "inputs": {
            "conditioning": ["94", 0]
          },
          "class_type": "ConditioningZeroOut",
          "_meta": { "title": "ConditioningZeroOut" }
        },
        "78": {
          "inputs": {
            "shift": shift,
            "model": ["97", 0]
          },
          "class_type": "ModelSamplingAuraFlow",
          "_meta": { "title": "ModelSamplingAuraFlow" }
        },
        "94": {
          "inputs": {
            "tags": dto.prompt,
            "lyrics": dto.lyrics,
            "seed": seed,
            "bpm": bpm,
            "duration": duration,
            "timesignature": timeSignature,
            "language": language,
            "keyscale": keyScale,
            "generate_audio_codes": true,
            "cfg_scale": cfgScale,
            "temperature": temperature,
            "top_p": topP,
            "top_k": topK,
            "min_p": minP,
            "clip": ["97", 1]
          },
          "class_type": "TextEncodeAceStepAudio1.5",
          "_meta": { "title": "TextEncodeAceStepAudio1.5" }
        },
        "97": {
          "inputs": {
            "ckpt_name": "ace_step_1.5_turbo_aio.safetensors"
          },
          "class_type": "CheckpointLoaderSimple",
          "_meta": { "title": "Charger Point de Contrôle" }
        },
        "98": {
          "inputs": {
            "seconds": duration,
            "batch_size": 1
          },
          "class_type": "EmptyAceStep1.5LatentAudio",
          "_meta": { "title": "Empty Ace Step 1.5 Latent Audio" }
        },
        "104": {
          "inputs": {
            "filename_prefix": `audio/music_${projectId}`,
            "quality": "V0",
            "audio": ["18", 0]
          },
          "class_type": "SaveAudioMP3",
          "_meta": { "title": "Enregistrer Audio (MP3)" }
        }
      };

      this.logger.log(`[music-generation] Sending workflow to ComfyUI: ${this.comfyuiUrl}`);
      await this.updateStatus(projectId, userId, 'GENERATING', 30, 'Generating music with AI...');

      // Call ComfyUI API
      const response = await axios.post(
        `${this.comfyuiUrl}/prompt`,
        {
          prompt: workflow,
          client_id: `vidrush_music_${projectId}`,
        },
        {
          timeout: 300000, // 5 minutes
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const promptId = response.data.prompt_id;
      this.logger.log(`[music-generation] ComfyUI prompt ID: ${promptId}`);

      await this.updateStatus(projectId, userId, 'GENERATING', 60, 'Processing audio...');

      // Poll for completion
      const audioUrl = await this.pollForCompletion(promptId, projectId);

      await this.prisma.musicProject.update({
        where: { id: projectId },
        data: { 
          status: 'DONE',
          audioUrl,
        },
      });

      this.videoGateway.emitProgress(userId, {
        videoGenerationId: projectId,
        status: VideoStatus.DONE,
        progress: 100,
        message: 'Your music is ready!',
        outputUrl: audioUrl,
      });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`[music-generation] Project ${projectId} failed: ${message}`);

      await this.prisma.musicProject.update({
        where: { id: projectId },
        data: { status: 'FAILED' },
      });

      this.videoGateway.emitProgress(userId, {
        videoGenerationId: projectId,
        status: VideoStatus.FAILED,
        progress: 0,
        message: `Music generation failed: ${message}`,
      });
    }
  }

  private async pollForCompletion(promptId: string, projectId: string): Promise<string> {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;

      try {
        const historyResponse = await axios.get(`${this.comfyuiUrl}/history/${promptId}`);
        const history = historyResponse.data[promptId];

        if (history && history.status?.completed) {
          // Extract audio file path from outputs
          const outputs = history.outputs;
          for (const nodeId in outputs) {
            const output = outputs[nodeId];
            if (output.audio && output.audio.length > 0) {
              const audioFile = output.audio[0];
              return `${this.comfyuiUrl}/view?filename=${audioFile.filename}&type=output&subfolder=${audioFile.subfolder || ''}`;
            }
          }
        }
      } catch (err) {
        this.logger.warn(`[music-generation] Polling attempt ${attempts} failed: ${err}`);
      }
    }

    throw new Error('Music generation timed out');
  }

  async getProjectStatus(projectId: string, userId: string) {
    const project = await this.prisma.musicProject.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new BadRequestException('Music project not found');
    
    return {
      status: project.status,
      audioUrl: project.audioUrl,
      prompt: project.prompt,
      lyrics: project.lyrics,
    };
  }

  async listUserProjects(userId: string) {
    return this.prisma.musicProject.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async updateStatus(
    projectId: string,
    userId: string,
    status: string,
    progress: number,
    message: string,
  ) {
    await this.prisma.musicProject.update({
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
