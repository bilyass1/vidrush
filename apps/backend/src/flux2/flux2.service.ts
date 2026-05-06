import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { randomUUID } from 'crypto';
import FormData from 'form-data';

export interface Flux2GenerateRequest {
  prompt: string;
  referenceImagePath?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
  seed?: number;
  enableTurbo?: boolean;
}

export interface Flux2GenerateResponse {
  jobId: string;
  imagePath: string;
  width: number;
  height: number;
}

@Injectable()
export class Flux2Service {
  private readonly logger = new Logger(Flux2Service.name);
  private readonly baseUrl: string;
  private readonly workflowPath: string;

  constructor() {
    this.baseUrl = process.env.COMFYUI_URL ?? 'https://hammer-helmet-sue-hunter.trycloudflare.com';
    this.workflowPath = path.join(process.cwd(), 'src/flux2/workflows/flux2_image_generation.json');

    this.logger.log(`Flux2 Service initialized with baseUrl: ${this.baseUrl}`);
    this.logger.log(`Workflow path: ${this.workflowPath}`);
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await axios.get(`${this.baseUrl}/system_stats`, {
        timeout: 5000,
      });
      
      this.logger.log(`Flux2 health check SUCCESS - Status: ${res.status}`);
      return res.status === 200;
    } catch (err: any) {
      this.logger.error(`Flux2 health check FAILED: ${err.message}`);
      return false;
    }
  }

  private loadWorkflow(): any {
    const workflowJson = fs.readFileSync(this.workflowPath, 'utf-8');
    return JSON.parse(workflowJson);
  }

  private async uploadImage(imagePath: string): Promise<string> {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    formData.append('overwrite', 'true');

    const res = await axios.post(`${this.baseUrl}/upload/image`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000,
    });

    this.logger.log(`Image uploaded: ${res.data.name}`);
    return res.data.name;
  }

  private patchWorkflow(workflow: any, req: Flux2GenerateRequest, uploadedImageName?: string): any {
    const patched = JSON.parse(JSON.stringify(workflow));
    
    const width = req.width ?? 1024;
    const height = req.height ?? 1024;
    const steps = req.steps ?? (req.enableTurbo ? 8 : 20);
    const guidance = req.guidance ?? 4;
    const seed = req.seed ?? Math.floor(Math.random() * 1000000000000000);
    
    this.logger.log(`Workflow params: ${width}x${height}, ${steps} steps, guidance: ${guidance}, turbo: ${req.enableTurbo}`);
    
    // Patch prompt (node 68:6 - CLIPTextEncode)
    if (patched['68:6']?.inputs) {
      patched['68:6'].inputs.text = req.prompt;
    }
    
    // Patch reference image if provided (node 46 - LoadImage)
    if (uploadedImageName && patched['46']?.inputs) {
      patched['46'].inputs.image = uploadedImageName;
    }
    
    // Patch seed (node 68:25 - RandomNoise)
    if (patched['68:25']?.inputs) {
      patched['68:25'].inputs.noise_seed = seed;
    }
    
    // Patch guidance (node 68:26 - FluxGuidance)
    if (patched['68:26']?.inputs) {
      patched['68:26'].inputs.guidance = guidance;
    }
    
    // Patch turbo mode (node 68:94 - Enable 8 steps lora)
    if (patched['68:94']?.inputs) {
      patched['68:94'].inputs.value = req.enableTurbo ?? true;
    }
    
    // Patch steps (node 68:90 for turbo, 68:91 for normal)
    if (req.enableTurbo && patched['68:90']?.inputs) {
      patched['68:90'].inputs.value = steps;
    } else if (!req.enableTurbo && patched['68:91']?.inputs) {
      patched['68:91'].inputs.value = steps;
    }
    
    return patched;
  }

  async generateImage(req: Flux2GenerateRequest): Promise<Flux2GenerateResponse> {
    // Upload reference image if provided
    let uploadedImageName: string | undefined;
    if (req.referenceImagePath && fs.existsSync(req.referenceImagePath)) {
      uploadedImageName = await this.uploadImage(req.referenceImagePath);
    }

    // Load and patch workflow
    const workflow = this.loadWorkflow();
    const patchedWorkflow = this.patchWorkflow(workflow, req, uploadedImageName);
    
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
    let imageFilename: string | null = null;
    let attempts = 0;
    const maxAttempts = 100; // 5 minutes max
    
    while (!imageFilename && attempts < maxAttempts) {
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
          const found = this.findImageInOutputs(historyData.outputs);
          if (found) {
            const { filename, subfolder } = found;
            this.logger.log(`Image ready: ${filename} (subfolder: ${subfolder})`);
            const imagePath = `${this.baseUrl}/api/view?filename=${encodeURIComponent(filename)}&type=output&subfolder=${encodeURIComponent(subfolder)}`;
            const width = req.width ?? 1024;
            const height = req.height ?? 1024;
            return {
              jobId: promptId,
              imagePath,
              width,
              height,
            };
          }
        }
        
        if (attempts % 10 === 0) {
          this.logger.log(`Still waiting for image... (${attempts * 3}s elapsed)`);
        }
      } catch (err: any) {
        const statusCode = err?.response?.status;
        
        if (statusCode === 502 || statusCode === 530 || statusCode === 503) {
          this.logger.warn(`Cloudflare tunnel error (${statusCode}) on attempt ${attempts}. Retrying...`);
        } else {
          this.logger.warn(`History poll attempt ${attempts} failed: ${err.message}`);
        }
      }
    }
    
    throw new Error('Image generation timed out or failed');
  }

  private findImageInOutputs(outputs: any): { filename: string; subfolder: string } | null {
    for (const nodeId of Object.keys(outputs)) {
      const node = outputs[nodeId];
      for (const key of Object.keys(node)) {
        const items = node[key];
        if (Array.isArray(items)) {
          const image = items.find((i: any) => 
            i.filename?.endsWith('.png') || 
            i.filename?.endsWith('.jpg') || 
            i.filename?.endsWith('.jpeg') ||
            i.filename?.endsWith('.webp')
          );
          if (image) {
            this.logger.log(`Found image in node ${nodeId}.${key}: ${image.filename}`);
            return { filename: image.filename, subfolder: image.subfolder ?? '' };
          }
        }
      }
    }
    return null;
  }

  async generateImageWithRetry(
    req: Flux2GenerateRequest,
    maxAttempts = 3,
  ): Promise<Flux2GenerateResponse> {
    let lastError: Error = new Error('Unknown error');
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.generateImage(req);
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`Flux2 attempt ${attempt}/${maxAttempts} failed: ${lastError.message}`);
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 5000));
        }
      }
    }
    throw new Error(`Flux2 generation failed after ${maxAttempts} attempts: ${lastError.message}`);
  }
}
