# ComfyUI Integration Changes

## Summary
Updated the LTX service to use ComfyUI API workflow instead of direct HTTP endpoints. The system now:
1. Loads a workflow JSON template
2. Patches it with user prompts and parameters
3. Submits to `/api/prompt`
4. Polls `/api/history/{promptId}` every 3 seconds
5. Returns the full video URL from the ComfyUI server

## Files Changed

### 1. `apps/backend/.env`

**BEFORE:**
```env
# LTX Video 2.3 server (separate from backend)
LTX_SERVER_URL="https://vault-folk-delivery-illustration.trycloudflare.com"
LTX_AUTH_USER=""
LTX_AUTH_PASS=""
```

**AFTER:**
```env
# LTX Video 2.3 server (ComfyUI via Cloudflare tunnel)
LTX_SERVER_URL="https://seed-sperm-sustained-border.trycloudflare.com"
```

**Changes:**
- Updated URL to Cloudflare tunnel
- Removed auth variables (no longer needed)

---

### 2. `apps/backend/src/ltx/workflows/video_ltx2_3_t2v.json` (NEW FILE)

**CREATED:**
```json
{
  "6": {
    "inputs": {
      "text": "PLACEHOLDER_PROMPT",
      "clip": ["11", 0]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Positive Prompt)"
    }
  },
  "8": {
    "inputs": {
      "samples": ["13", 0],
      "vae": ["10", 0]
    },
    "class_type": "VAEDecode",
    "_meta": {
      "title": "VAE Decode"
    }
  },
  "9": {
    "inputs": {
      "filename_prefix": "ComfyUI",
      "images": ["8", 0]
    },
    "class_type": "VHS_VideoCombine",
    "_meta": {
      "title": "Video Combine"
    }
  },
  "10": {
    "inputs": {
      "vae_name": "ltx-video-2.3-vae-bf16.safetensors"
    },
    "class_type": "VAELoader",
    "_meta": {
      "title": "Load VAE"
    }
  },
  "11": {
    "inputs": {
      "clip_name1": "t5xxl_fp16.safetensors",
      "clip_name2": "clip_l.safetensors",
      "type": "flux"
    },
    "class_type": "DualCLIPLoader",
    "_meta": {
      "title": "DualCLIPLoader"
    }
  },
  "12": {
    "inputs": {
      "unet_name": "ltx-video-2.3-bf16.safetensors"
    },
    "class_type": "UNETLoader",
    "_meta": {
      "title": "Load Diffusion Model"
    }
  },
  "13": {
    "inputs": {
      "seed": 42,
      "steps": 30,
      "cfg": 7.5,
      "sampler_name": "euler",
      "scheduler": "simple",
      "denoise": 1,
      "model": ["12", 0],
      "positive": ["6", 0],
      "negative": ["27", 0],
      "latent_image": ["25", 0]
    },
    "class_type": "KSampler",
    "_meta": {
      "title": "KSampler"
    }
  },
  "25": {
    "inputs": {
      "width": 768,
      "height": 432,
      "length": 97,
      "batch_size": 1
    },
    "class_type": "EmptyLTXVLatentVideo",
    "_meta": {
      "title": "EmptyLTXVLatentVideo"
    }
  },
  "27": {
    "inputs": {
      "text": "worst quality, inconsistent motion, blurry, jittery, distorted",
      "clip": ["11", 0]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Negative Prompt)"
    }
  }
}
```

**Purpose:**
- ComfyUI workflow template for LTX Video 2.3
- Node 6: Positive prompt (patched with user input)
- Node 27: Negative prompt (patched with user input)
- Node 13: KSampler (steps, cfg, seed patched)
- Node 25: Latent dimensions (width, height, frames patched)

---

### 3. `apps/backend/src/video-generation/services/ltx.service.ts`

**BEFORE:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as http from 'http';
import axios from 'axios';

@Injectable()
export class LtxService {
  private readonly logger = new Logger(LtxService.name);
  private readonly baseUrl: string;
  private readonly authUser: string;
  private readonly authPass: string;

  constructor() {
    this.baseUrl = process.env.LTX_SERVER_URL ?? 'https://vault-folk-delivery-illustration.trycloudflare.com';
    this.authUser = process.env.LTX_AUTH_USER ?? '';
    this.authPass = process.env.LTX_AUTH_PASS ?? '';
    
    this.logger.log(`LTX Service initialized with baseUrl: ${this.baseUrl}`);
    this.logger.log(`LTX_SERVER_URL from env: ${process.env.LTX_SERVER_URL || 'NOT SET'}`);
    this.logger.log(`LTX Auth configured: ${this.authUser ? 'YES' : 'NO'}`);
  }

  private getAuthHeaders(): Record<string, string> {
    if (!this.authUser) {
      return {};
    }
    const credentials = Buffer.from(`${this.authUser}:${this.authPass}`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`,
    };
  }

  async checkHealth(): Promise<boolean> {
    // ... old implementation with http module and auth
  }

  async generateClip(req: LtxGenerateRequest): Promise<LtxGenerateResponse> {
    // ... old implementation posting to /generate endpoint
  }

  async downloadClip(jobId: string, destPath: string): Promise<string> {
    // ... old implementation downloading from /video/{jobId}
  }

  async deleteClip(jobId: string): Promise<void> {
    // ... old implementation deleting via /video/{jobId}
  }
}
```

**AFTER:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

@Injectable()
export class LtxService {
  private readonly logger = new Logger(LtxService.name);
  private readonly baseUrl: string;
  private readonly workflowPath: string;

  constructor() {
    this.baseUrl = process.env.LTX_SERVER_URL ?? 'https://seed-sperm-sustained-border.trycloudflare.com';
    this.workflowPath = path.join(__dirname, '../../ltx/workflows/video_ltx2_3_t2v.json');
    
    this.logger.log(`LTX Service initialized with baseUrl: ${this.baseUrl}`);
    this.logger.log(`Workflow path: ${this.workflowPath}`);
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await axios.get(`${this.baseUrl}/system_stats`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
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
    
    // Patch positive prompt (node 6)
    if (patched['6']?.inputs) {
      patched['6'].inputs.text = req.prompt;
    }
    
    // Patch negative prompt (node 27)
    if (patched['27']?.inputs && req.negativePrompt) {
      patched['27'].inputs.text = req.negativePrompt;
    }
    
    // Patch KSampler settings (node 13)
    if (patched['13']?.inputs) {
      if (req.numInferenceSteps) patched['13'].inputs.steps = req.numInferenceSteps;
      if (req.guidanceScale) patched['13'].inputs.cfg = req.guidanceScale;
      if (req.seed !== undefined) patched['13'].inputs.seed = req.seed;
    }
    
    // Patch latent dimensions (node 25)
    if (patched['25']?.inputs) {
      if (req.width) patched['25'].inputs.width = req.width;
      if (req.height) patched['25'].inputs.height = req.height;
      if (req.numFrames) patched['25'].inputs.length = req.numFrames;
    }
    
    return patched;
  }

  async generateClip(req: LtxGenerateRequest): Promise<LtxGenerateResponse> {
    // Load and patch workflow
    const workflow = this.loadWorkflow();
    const patchedWorkflow = this.patchWorkflow(workflow, req);
    
    this.logger.log(`Submitting workflow to ComfyUI: ${req.prompt.substring(0, 50)}...`);
    
    // Submit workflow to /api/prompt
    const promptRes = await axios.post(
      `${this.baseUrl}/api/prompt`,
      { prompt: patchedWorkflow },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
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
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        const historyData = historyRes.data[promptId];
        
        if (historyData?.outputs) {
          // Look for video output in any node
          for (const nodeId in historyData.outputs) {
            const output = historyData.outputs[nodeId];
            if (output.gifs && output.gifs.length > 0) {
              videoFilename = output.gifs[0].filename;
              this.logger.log(`Video ready: ${videoFilename}`);
              break;
            }
          }
        }
        
        if (attempts % 10 === 0) {
          this.logger.log(`Still waiting for video... (${attempts * 3}s elapsed)`);
        }
      } catch (err: any) {
        this.logger.warn(`History poll attempt ${attempts} failed: ${err.message}`);
      }
    }
    
    if (!videoFilename) {
      throw new Error('Video generation timed out or failed');
    }
    
    // Construct the full video URL
    const videoPath = `${this.baseUrl}/api/view?filename=${encodeURIComponent(videoFilename)}&type=output&subfolder=`;
    
    const width = req.width ?? 768;
    const height = req.height ?? 432;
    const numFrames = req.numFrames ?? 97;
    const fps = req.fps ?? 24;
    const durationSec = numFrames / fps;
    
    return {
      jobId: promptId,
      videoPath: videoPath,
      durationSec: durationSec,
      width: width,
      height: height,
      fps: fps,
      lastFrameBase64: '',
    };
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
}
```

**Key Changes:**
1. **Removed auth** - No more Basic Auth headers
2. **Added workflow loading** - Reads JSON template from file
3. **Added workflow patching** - Dynamically updates prompt, steps, cfg, dimensions
4. **New generateClip flow**:
   - POST workflow to `/api/prompt`
   - Poll `/api/history/{promptId}` every 3 seconds
   - Extract video filename from outputs
   - Return full URL: `{LTX_SERVER_URL}/api/view?filename=X&type=output&subfolder=`
5. **Simplified health check** - Just uses axios with Content-Type header
6. **Headers** - Only `Content-Type: application/json`, no Authorization

---

## Frontend Impact

The frontend will receive `videoPath` as a full URL like:
```
https://seed-sperm-sustained-border.trycloudflare.com/api/view?filename=ComfyUI_00001.mp4&type=output&subfolder=
```

This can be used directly in a `<video>` tag:
```tsx
<video src={videoPath} controls />
```

No localhost proxying needed - the video is served directly from the ComfyUI server via the Cloudflare tunnel.

---

## Testing

1. Restart the backend to load new env variables
2. Test health check: Should hit `/system_stats`
3. Test video generation: Should submit workflow, poll history, return full URL
4. Frontend should display video from the returned URL

---

## Notes

- The workflow JSON uses LTX Video 2.3 models
- Polling timeout is 10 minutes (200 attempts × 3 seconds)
- Video URLs are permanent and can be accessed anytime
- No authentication required for ComfyUI endpoints
