# 🎨 Flux2 Image Generation - Visual Guide

> A visual walkthrough of the Flux2 image generation feature

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        VidRush Platform                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Flux2ImageGenerator Component              │    │
│  │  • Image upload                                     │    │
│  │  • Prompt input                                     │    │
│  │  • Settings (turbo, steps)                         │    │
│  │  • Progress tracking                                │    │
│  │  • Image preview                                    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (NestJS)                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Flux2Controller                        │    │
│  │  • POST /api/flux2/generate                        │    │
│  │  • POST /api/flux2/health                          │    │
│  │  • JWT Authentication                               │    │
│  │  • File Upload (multer)                            │    │
│  └────────────────────────────────────────────────────┘    │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Flux2Service                           │    │
│  │  • Workflow execution                               │    │
│  │  • Image upload to ComfyUI                         │    │
│  │  • Retry logic                                      │    │
│  │  • Health monitoring                                │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ComfyUI Server                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Flux2 Workflow                         │    │
│  │  • Load reference image                             │    │
│  │  • Encode prompt with CLIP                         │    │
│  │  • Apply Flux2 model                               │    │
│  │  • Generate image                                   │    │
│  │  • Save output                                      │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Generation Flow

```
User Action
    │
    ▼
┌─────────────────┐
│ Enter Prompt    │
│ Upload Image    │ (optional)
│ Set Parameters  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Click Generate  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Frontend: Create FormData           │
│ • prompt                             │
│ • referenceImage (if any)           │
│ • enableTurbo, steps, etc.          │
└────────┬────────────────────────────┘
         │
         │ POST /api/flux2/generate
         ▼
┌─────────────────────────────────────┐
│ Backend: Validate Request           │
│ • Check JWT token                   │
│ • Validate file type/size           │
│ • Validate parameters               │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Backend: Upload Image (if provided) │
│ • Save to uploads/flux2-references  │
│ • Upload to ComfyUI                 │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Backend: Patch Workflow             │
│ • Set prompt                        │
│ • Set reference image               │
│ • Set turbo mode                    │
│ • Set steps, guidance, seed         │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Backend: Submit to ComfyUI          │
│ • POST /api/prompt                  │
│ • Get prompt_id                     │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ ComfyUI: Execute Workflow           │
│ 1. Load reference image             │
│ 2. Resize to target resolution      │
│ 3. Encode with VAE                  │
│ 4. Load models (UNET, CLIP, LoRA)  │
│ 5. Encode prompt with CLIP          │
│ 6. Apply guidance                   │
│ 7. Sample with Flux2Scheduler       │
│ 8. Decode latent to image           │
│ 9. Save image                       │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Backend: Poll for Completion        │
│ • GET /api/history/{prompt_id}      │
│ • Check every 3 seconds             │
│ • Max 5 minutes timeout             │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Backend: Return Image URL           │
│ • Extract filename from outputs     │
│ • Build view URL                    │
│ • Return to frontend                │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Frontend: Display Image             │
│ • Show preview                      │
│ • Enable download                   │
│ • Call onImageGenerated callback    │
└─────────────────────────────────────┘
```

---

## 📁 File Structure

```
vidrush/
│
├── apps/
│   │
│   ├── backend/
│   │   └── src/
│   │       ├── flux2/                    ← New Module
│   │       │   ├── dto/
│   │       │   │   └── generate-image.dto.ts
│   │       │   ├── workflows/
│   │       │   │   └── flux2_image_generation.json
│   │       │   ├── flux2.controller.ts
│   │       │   ├── flux2.module.ts
│   │       │   └── flux2.service.ts
│   │       │
│   │       ├── app.module.ts            ← Updated
│   │       │
│   │       └── uploads/
│   │           └── flux2-references/    ← New Directory
│   │
│   └── web/
│       └── src/
│           ├── components/
│           │   └── youtube/
│           │       └── Flux2ImageGenerator.tsx  ← New Component
│           │
│           └── lib/
│               └── api.ts               ← Updated
│
└── docs/                                ← New Documentation
    ├── FLUX2_README.md
    ├── FLUX2_IMAGE_GENERATION.md
    ├── FLUX2_GUIDE_RAPIDE_FR.md
    ├── FLUX2_YOUTUBE_INTEGRATION_EXAMPLE.md
    ├── FLUX2_DEPLOYMENT_GUIDE.md
    ├── FLUX2_IMPLEMENTATION_SUMMARY.md
    ├── FLUX2_CHANGELOG.md
    ├── FLUX2_DOCUMENTATION_INDEX.md
    ├── FLUX2_INTEGRATION_COMPLETE.md
    ├── FLUX2_FINAL_SUMMARY.md
    ├── FLUX2_VISUAL_GUIDE.md
    └── test-flux2-service.ts
```

---

## 🎨 Component UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Flux2 Image Generator                                       │
│  Generate AI images with Flux2 model                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Image Prompt                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Describe the image you want to generate...          │   │
│  │                                                       │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Reference Image (Optional)                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         📤 Click to upload or drag and drop          │   │
│  │         PNG, JPG, WEBP (MAX. 10MB)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Settings                                                    │
│  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │ ☑ Turbo Mode         │  │ Steps: 8                  │   │
│  │   (8 steps)          │  │ ━━━━━━━━━━━━━━━━━━━━━━  │   │
│  └──────────────────────┘  └──────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           ✨ Generate Image                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Generated Image                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │              [Generated Image Preview]               │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │  Download Image      │  │  Use This Image          │   │
│  └──────────────────────┘  └──────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Request/Response

### Request

```
POST /api/flux2/generate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

┌─────────────────────────────────────┐
│ FormData                             │
├─────────────────────────────────────┤
│ prompt: "A beautiful sunset"        │
│ referenceImage: [File]              │
│ enableTurbo: true                   │
│ steps: 8                            │
│ width: 1024                         │
│ height: 1024                        │
│ guidance: 4                         │
└─────────────────────────────────────┘
```

### Response

```json
{
  "success": true,
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "imagePath": "https://hammer-helmet-sue-hunter.trycloudflare.com/api/view?filename=Flux2_00001_.png&type=output&subfolder=",
    "width": 1024,
    "height": 1024
  }
}
```

---

## ⚙️ ComfyUI Workflow Nodes

```
┌─────────────────────────────────────────────────────────────┐
│                    Flux2 Workflow                            │
└─────────────────────────────────────────────────────────────┘

Input Layer
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ LoadImage    │  │ CLIPLoader   │  │ VAELoader    │
│ (Reference)  │  │ (Mistral)    │  │ (Encoder)    │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ImageScale   │  │ CLIPEncode   │  │ UNETLoader   │
│ ToPixels     │  │ (Prompt)     │  │ (Flux2)      │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ GetImageSize │  │ FluxGuidance │  │ LoraLoader   │
│              │  │              │  │ (Turbo)      │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ VAEEncode    │  │ Reference    │  │ Switch       │
│              │  │ Latent       │  │ (Model)      │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────┬───────┴─────────────────┘
                 ▼
         ┌──────────────┐
         │ BasicGuider  │
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │ Sampler      │
         │ Custom       │
         │ Advanced     │
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │ VAEDecode    │
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │ SaveImage    │
         └──────────────┘
```

---

## 🔄 State Management

```
Frontend Component State
┌─────────────────────────────────────┐
│ prompt: string                       │
│ referenceImage: File | null         │
│ imagePreview: string | null         │
│ generatedImage: string | null       │
│ isGenerating: boolean               │
│ error: string | null                │
│ enableTurbo: boolean                │
│ steps: number                       │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ User Actions                         │
├─────────────────────────────────────┤
│ • handleImageUpload()               │
│ • removeImage()                     │
│ • handleGenerate()                  │
│ • onImageGenerated()                │
└─────────────────────────────────────┘
```

---

## 📊 Performance Timeline

```
Turbo Mode (8 steps)
├─ 0s    : Request submitted
├─ 1s    : Image uploaded (if any)
├─ 2s    : Workflow patched
├─ 3s    : ComfyUI starts processing
├─ 10s   : Model loading
├─ 30s   : Generation in progress
├─ 50s   : Image ready
└─ 60s   : Response returned

Normal Mode (20 steps)
├─ 0s    : Request submitted
├─ 1s    : Image uploaded (if any)
├─ 2s    : Workflow patched
├─ 3s    : ComfyUI starts processing
├─ 10s   : Model loading
├─ 60s   : Generation in progress
├─ 150s  : Image ready
└─ 180s  : Response returned
```

---

## 🔐 Security Flow

```
┌─────────────────┐
│ User Request    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ JWT Authentication                   │
│ • Verify token                      │
│ • Check expiration                  │
│ • Extract user info                 │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ File Validation                      │
│ • Check file type                   │
│ • Check file size (< 10MB)          │
│ • Validate MIME type                │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Input Validation                     │
│ • Validate prompt (3-1000 chars)    │
│ • Validate steps (4-50)             │
│ • Validate dimensions (512-2048)    │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Path Sanitization                    │
│ • Generate unique filename          │
│ • Prevent path traversal            │
│ • Store in safe directory           │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Process Request                      │
└─────────────────────────────────────┘
```

---

## 🎯 Use Case Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User                                  │
└────────┬────────────────────────────────────────────────────┘
         │
         ├─► Generate YouTube Thumbnail
         │   └─► Input: Video topic
         │       Output: Custom thumbnail
         │
         ├─► Create Reference Image
         │   └─► Input: Scene description
         │       Output: Reference for video
         │
         ├─► Generate Product Image
         │   └─► Input: Product description
         │       Output: Marketing visual
         │
         ├─► Create Concept Art
         │   └─► Input: Artistic vision
         │       Output: Concept image
         │
         └─► Generate Social Media Visual
             └─► Input: Campaign idea
                 Output: Social media post
```

---

## 📈 Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                    Flux2 Metrics                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Total Generations: 1,234                                    │
│  Success Rate: 98.5%                                         │
│  Average Time: 45s                                           │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Generation Time (last 24h)                          │   │
│  │ ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Success vs Failure                                   │   │
│  │ ████████████████████████████████████████ 98.5%      │   │
│  │ ██ 1.5%                                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Mode Usage                                           │   │
│  │ Turbo:  ████████████████████████ 80%                │   │
│  │ Normal: █████ 20%                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Scheme

```
Primary Colors
┌──────────┬──────────┬──────────┐
│ Purple   │ Pink     │ Cyan     │
│ #9333EA  │ #EC4899  │ #06B6D4  │
└──────────┴──────────┴──────────┘

Background Colors
┌──────────┬──────────┬──────────┐
│ Zinc-950 │ Zinc-900 │ Zinc-800 │
│ #09090B  │ #18181B  │ #27272A  │
└──────────┴──────────┴──────────┘

Text Colors
┌──────────┬──────────┬──────────┐
│ White    │ Zinc-400 │ Zinc-600 │
│ #FFFFFF  │ #A1A1AA  │ #52525B  │
└──────────┴──────────┴──────────┘

Status Colors
┌──────────┬──────────┬──────────┐
│ Success  │ Error    │ Warning  │
│ #10B981  │ #EF4444  │ #F59E0B  │
└──────────┴──────────┴──────────┘
```

---

## 🚀 Quick Reference

### Start Services
```bash
# Backend
cd apps/backend && npm run dev

# Frontend
cd apps/web && npm run dev
```

### Test
```bash
export TEST_JWT="your-token"
ts-node test-flux2-service.ts
```

### Health Check
```bash
curl -X POST http://localhost:3001/api/flux2/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Generate Image
```bash
curl -X POST http://localhost:3001/api/flux2/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "prompt=A beautiful sunset" \
  -F "enableTurbo=true"
```

---

**Made with ❤️ by Kiro AI Assistant**

**Version:** 1.0.0  
**Last Updated:** 2026-05-06
