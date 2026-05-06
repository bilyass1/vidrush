# Flux2 Image Generation Feature

## Overview
This feature integrates Flux2 AI image generation into the VidRush platform, allowing users to generate high-quality images using the Flux2 model via ComfyUI.

## Architecture

### Backend Components

1. **Flux2 Service** (`apps/backend/src/flux2/flux2.service.ts`)
   - Handles communication with ComfyUI server
   - Manages workflow execution
   - Supports reference image upload
   - Implements retry logic for reliability

2. **Flux2 Controller** (`apps/backend/src/flux2/flux2.controller.ts`)
   - REST API endpoints for image generation
   - File upload handling with multer
   - Authentication via JWT

3. **Flux2 Module** (`apps/backend/src/flux2/flux2.module.ts`)
   - NestJS module configuration
   - Exports service for use in other modules

4. **Workflow Configuration** (`apps/backend/src/flux2/workflows/flux2_image_generation.json`)
   - ComfyUI workflow definition
   - Based on Flux2 model with turbo LoRA support
   - Supports reference image input

### Frontend Components

1. **Flux2ImageGenerator Component** (`apps/web/src/components/youtube/Flux2ImageGenerator.tsx`)
   - React component for image generation UI
   - Reference image upload
   - Real-time generation status
   - Image preview and download

2. **API Client** (`apps/web/src/lib/api.ts`)
   - TypeScript client for Flux2 endpoints
   - Type-safe request/response handling

## API Endpoints

### POST /api/flux2/generate
Generate an image using Flux2 model.

**Request (multipart/form-data):**
```typescript
{
  prompt: string;              // Image description
  referenceImage?: File;       // Optional reference image
  width?: number;              // Default: 1024
  height?: number;             // Default: 1024
  steps?: number;              // Default: 8 (turbo) or 20 (normal)
  guidance?: number;           // Default: 4
  seed?: number;               // Random if not provided
  enableTurbo?: boolean;       // Default: true
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    jobId: string;
    imagePath: string;         // URL to generated image
    width: number;
    height: number;
  }
}
```

### POST /api/flux2/health
Check ComfyUI server health status.

**Response:**
```typescript
{
  success: boolean;
  connected: boolean;
  url: string;
}
```

## Configuration

### Environment Variables

Add to `apps/backend/.env`:
```env
COMFYUI_URL=https://hammer-helmet-sue-hunter.trycloudflare.com
```

### Required ComfyUI Models

The workflow requires these models to be installed in ComfyUI:

1. **UNET Model:**
   - `flux2_dev_fp8mixed.safetensors`

2. **CLIP Model:**
   - `mistral_3_small_flux2_bf16.safetensors`

3. **VAE Model:**
   - `full_encoder_small_decoder.safetensors`

4. **LoRA Model:**
   - `Flux_2-Turbo-LoRA_comfyui.safetensors`

### Required ComfyUI Custom Nodes

- `ComfySwitchNode` - For conditional workflow branching
- `Flux2Scheduler` - Flux2-specific scheduler
- `EmptyFlux2LatentImage` - Flux2 latent image initialization
- `ReferenceLatent` - Reference image conditioning
- `ImageScaleToTotalPixels` - Image resizing

## Usage Example

### Frontend Integration

```typescript
import Flux2ImageGenerator from '@/components/youtube/Flux2ImageGenerator'

function MyComponent() {
  const handleImageGenerated = (imageUrl: string) => {
    console.log('Generated image:', imageUrl)
    // Use the image URL as needed
  }

  return (
    <Flux2ImageGenerator onImageGenerated={handleImageGenerated} />
  )
}
```

### Direct API Usage

```typescript
import { flux2 } from '@/lib/api'

async function generateImage() {
  const formData = new FormData()
  formData.append('prompt', 'A beautiful sunset over mountains')
  formData.append('enableTurbo', 'true')
  formData.append('steps', '8')
  
  const result = await flux2.generateImage(formData)
  console.log('Image URL:', result.data.imagePath)
}
```

## Features

### Turbo Mode
- **Enabled (default):** Uses 8 steps with Flux2-Turbo LoRA for fast generation (~30-60 seconds)
- **Disabled:** Uses 20 steps for higher quality (~2-3 minutes)

### Reference Image Support
- Upload a reference image to guide the generation
- Image is automatically uploaded to ComfyUI
- Supports PNG, JPG, JPEG, WEBP formats
- Maximum file size: 10MB

### Automatic Retry
- Service automatically retries failed generations up to 3 times
- Handles Cloudflare tunnel errors gracefully
- 5-second delay between retry attempts

## Integration with YouTube Page

To add the Flux2 image generator to the YouTube page:

```typescript
import Flux2ImageGenerator from '@/components/youtube/Flux2ImageGenerator'

// In your YouTube page component
<Flux2ImageGenerator 
  onImageGenerated={(imageUrl) => {
    // Use the generated image for video thumbnail or reference
    setThumbnailUrl(imageUrl)
  }}
/>
```

## Workflow Details

The ComfyUI workflow follows this pipeline:

1. **Load Reference Image** (if provided)
2. **Resize Image** to target resolution
3. **Encode Image** to latent space
4. **Load Models** (UNET, CLIP, VAE, LoRA)
5. **Encode Prompt** with CLIP
6. **Apply Guidance** and conditioning
7. **Sample Latent** with Flux2 scheduler
8. **Decode Latent** to image
9. **Save Image** and return URL

## Error Handling

The service handles various error scenarios:

- **Network Errors:** Automatic retry with exponential backoff
- **Cloudflare Tunnel Errors:** Graceful handling of 502/530/503 errors
- **Timeout:** Maximum 5 minutes for generation
- **Invalid Input:** Validation errors with clear messages

## Performance

- **Turbo Mode:** ~30-60 seconds per image
- **Normal Mode:** ~2-3 minutes per image
- **Image Size:** 1024x1024 pixels (configurable)
- **Concurrent Requests:** Handled by ComfyUI queue system

## Security

- **Authentication:** All endpoints require JWT authentication
- **File Upload:** Validated file types and size limits
- **Path Traversal:** Protected by multer configuration
- **Rate Limiting:** Recommended to add rate limiting in production

## Future Enhancements

1. **Multiple Aspect Ratios:** Support for 16:9, 9:16, 1:1, etc.
2. **Batch Generation:** Generate multiple variations at once
3. **Style Presets:** Pre-configured styles for common use cases
4. **Image Editing:** Inpainting and outpainting support
5. **History:** Save and browse previously generated images
6. **Integration:** Direct use in video generation pipeline

## Troubleshooting

### ComfyUI Connection Issues
```bash
# Check ComfyUI health
curl https://hammer-helmet-sue-hunter.trycloudflare.com/system_stats
```

### Missing Models
- Ensure all required models are installed in ComfyUI
- Check ComfyUI console for model loading errors

### Slow Generation
- Enable Turbo mode for faster results
- Check ComfyUI server resources (GPU, RAM)
- Verify Cloudflare tunnel stability

### Upload Errors
- Verify file size is under 10MB
- Check file format is supported
- Ensure uploads directory exists and is writable

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [COMFYUI_INTEGRATION_CHANGES.md](./COMFYUI_INTEGRATION_CHANGES.md) - ComfyUI integration details
- [IMAGE_UPLOAD_FEATURE.md](./IMAGE_UPLOAD_FEATURE.md) - Image upload implementation
