import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { randomUUID } from 'crypto';

export interface LtxGenerateRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numFrames?: number;
  fps?: number;
  numInferenceSteps?: number;
  guidanceScale?: number;
  seed?: number;
  firstFrameBase64?: string | null;
}

export interface LtxGenerateResponse {
  jobId: string;
  videoPath: string;
  durationSec: number;
  width: number;
  height: number;
  fps: number;
  lastFrameBase64: string;
}

@Injectable()
export class LtxService {
  private readonly logger = new Logger(LtxService.name);
  private readonly baseUrl: string;
  private readonly workflowPath: string;

  constructor() {
    this.baseUrl = process.env.LTX_SERVER_URL ?? 'https://vault-folk-delivery-illustration.trycloudflare.com';
    // Use process.cwd() (apps/backend) so the path works in both src and dist
    this.workflowPath = path.join(process.cwd(), 'src/ltx/workflows/video_ltx2_3_t2v.json');

    this.logger.log(`LTX Service initialized with baseUrl: ${this.baseUrl}`);
    this.logger.log(`Workflow path: ${this.workflowPath}`);
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await axios.get(`${this.baseUrl}/system_stats`, {
        timeout: 5000,
      });
      
      this.logger.log(`LTX health check SUCCESS - Status: ${res.status}`);
      return res.status === 200;
    } catch (err: any) {
      this.logger.error(`LTX health check FAILED: ${err.message}`);
      return false;
    }
  }

  private loadWorkflow(): any {
    const workflowJson = fs.readFileSync(this.workflowPath, 'utf-8');
    return JSON.parse(workflowJson);
  }

  private patchWorkflow(workflow: any, req: LtxGenerateRequest): any {
    const patched = JSON.parse(JSON.stringify(workflow));
    
    // Patch prompt (node 267:266 - PrimitiveStringMultiline "Prompt")
    if (patched['267:266']?.inputs) {
      patched['267:266'].inputs.value = req.prompt;
    }
    
    // Patch negative prompt (node 267:247 - CLIPTextEncode negative)
    if (patched['267:247']?.inputs && req.negativePrompt) {
      patched['267:247'].inputs.text = req.negativePrompt;
    }
    
    // Patch "Switch to Text to Video?" (node 267:201 - PrimitiveBoolean)
    if (patched['267:201']?.inputs) {
      patched['267:201'].inputs.value = true; // Always text-to-video mode
    }
    
    // Patch width (node 267:257 - PrimitiveInt "Width")
    if (patched['267:257']?.inputs && req.width) {
      patched['267:257'].inputs.value = req.width;
    }
    
    // Patch height (node 267:258 - PrimitiveInt "Height")
    if (patched['267:258']?.inputs && req.height) {
      patched['267:258'].inputs.value = req.height;
    }
    
    // Patch frame rate (node 267:260 - PrimitiveInt "Frame Rate")
    if (patched['267:260']?.inputs && req.fps) {
      patched['267:260'].inputs.value = req.fps;
    }
    
    // Patch length/frames (node 267:225 - PrimitiveInt "Length")
    if (patched['267:225']?.inputs && req.numFrames) {
      patched['267:225'].inputs.value = req.numFrames;
    }
    
    // Patch seed (node 267:216 - RandomNoise)
    if (patched['267:216']?.inputs && req.seed !== undefined) {
      patched['267:216'].inputs.noise_seed = req.seed;
    }
    
    return patched;
  }

  async generateClip(req: LtxGenerateRequest): Promise<LtxGenerateResponse> {
    // Load and patch workflow
    const workflow = this.loadWorkflow();
    const patchedWorkflow = this.patchWorkflow(workflow, req);
    
    const clientId = randomUUID();
    
    this.logger.log(`Submitting workflow to ComfyUI: ${req.prompt.substring(0, 50)}...`);
    this.logger.log(`Client ID: ${clientId}`);
    
    // Submit workflow to /api/prompt
    const promptRes = await axios.post(
      `${this.baseUrl}/api/prompt`,
      { 
        client_id: clientId,
        prompt: patchedWorkflow 
      },
      {
        timeout: 30000,
      }
    );
    
    const promptId = promptRes.data.prompt_id;
    this.logger.log(`Workflow submitted, prompt_id: ${promptId}`);
    
    // Poll /api/history/{promptId} every 3 seconds
    let videoFilename: string | null = null;
    let attempts = 0;
    const maxAttempts = 200; // 10 minutes max
    
    while (!videoFilename && attempts < maxAttempts) {
      attempts++;
      await new Promise(r => setTimeout(r, 3000));
      
      try {
        const historyRes = await axios.get(
          `${this.baseUrl}/api/history/${promptId}`,
          {
            timeout: 10000,
          }
        );
        
        const historyData = historyRes.data[promptId];
        
        if (historyData?.outputs) {
          const found = this.findVideoInOutputs(historyData.outputs);
          if (found) {
            const { filename, subfolder } = found;
            this.logger.log(`Video ready: ${filename} (subfolder: ${subfolder})`);
            const videoPath = `${this.baseUrl}/api/view?filename=${encodeURIComponent(filename)}&type=output&subfolder=${encodeURIComponent(subfolder)}`;
            const width = req.width ?? 1080;
            const height = req.height ?? 720;
            const numFrames = req.numFrames ?? 193;
            const fps = req.fps ?? 25;
            return {
              jobId: promptId,
              videoPath,
              durationSec: numFrames / fps,
              width,
              height,
              fps,
              lastFrameBase64: '',
            };
          }
        }
        
        if (attempts % 10 === 0) {
          this.logger.log(`Still waiting for video... (${attempts * 3}s elapsed)`);
        }
      } catch (err: any) {
        const statusCode = err?.response?.status;
        
        // Cloudflare tunnel errors (502, 530, 1033)
        if (statusCode === 502 || statusCode === 530 || statusCode === 503) {
          this.logger.warn(`Cloudflare tunnel error (${statusCode}) on attempt ${attempts}. Retrying...`);
          
          // If we've had 20+ consecutive tunnel errors, the tunnel is likely down
          if (attempts > 20 && attempts % 20 === 0) {
            this.logger.error(`Cloudflare tunnel appears to be down after ${attempts} attempts. Video may still be generating on server.`);
            this.logger.error(`You can check manually at: ${this.baseUrl}/api/history/${promptId}`);
          }
        } else {
          this.logger.warn(`History poll attempt ${attempts} failed: ${err.message}`);
        }
      }
    }
    
    throw new Error('Video generation timed out or failed');
  }

  private findVideoInOutputs(outputs: any): { filename: string; subfolder: string } | null {
    for (const nodeId of Object.keys(outputs)) {
      const node = outputs[nodeId];
      for (const key of Object.keys(node)) {
        const items = node[key];
        if (Array.isArray(items)) {
          const video = items.find((i: any) => i.filename?.endsWith('.mp4'));
          if (video) {
            this.logger.log(`Found video in node ${nodeId}.${key}: ${video.filename}`);
            return { filename: video.filename, subfolder: video.subfolder ?? '' };
          }
        }
      }
    }
    return null;
  }

  async downloadClip(jobId: string, destPath: string): Promise<string> {
    // Not needed for ComfyUI workflow - videos are accessed via URL
    this.logger.warn('downloadClip not implemented for ComfyUI workflow');
    return destPath;
  }

  async deleteClip(jobId: string): Promise<void> {
    // ComfyUI doesn't have a delete endpoint
    this.logger.warn('deleteClip not implemented for ComfyUI workflow');
  }

  async generateClipWithRetry(
    req: LtxGenerateRequest,
    maxAttempts = 3,
  ): Promise<LtxGenerateResponse> {
    let lastError: Error = new Error('Unknown error');
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.generateClip(req);
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`LTX attempt ${attempt}/${maxAttempts} failed: ${lastError.message}`);
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 5000));
        }
      }
    }
    throw new Error(`LTX generation failed after ${maxAttempts} attempts: ${lastError.message}`);
  }
}
