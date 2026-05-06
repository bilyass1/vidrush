# 🎨 Flux2 Image Generation for VidRush

> AI-powered image generation using Flux2 model via ComfyUI integration

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🌟 Overview

The Flux2 Image Generation feature brings powerful AI image generation capabilities to VidRush. Generate high-quality images from text descriptions, use reference images for guidance, and integrate seamlessly with your video production workflow.

### Key Highlights

- ⚡ **Fast Generation**: Turbo mode generates images in 30-60 seconds
- 🎯 **High Quality**: Professional-grade images at 1024x1024 resolution
- 🖼️ **Reference Support**: Use existing images to guide generation
- 🔧 **Customizable**: Adjust steps, guidance, and other parameters
- 🔐 **Secure**: JWT authentication and file validation
- 📱 **Easy Integration**: Drop-in React component

## ✨ Features

### Core Capabilities

- **Text-to-Image**: Generate images from text descriptions
- **Image-to-Image**: Use reference images for guided generation
- **Turbo Mode**: Fast generation with 8 steps (~30-60s)
- **Normal Mode**: High-quality generation with 20 steps (~2-3min)
- **Custom Parameters**: Control steps, guidance, seed, and resolution
- **Automatic Retry**: Robust error handling with retry logic

### Technical Features

- **Type-Safe API**: Full TypeScript support
- **File Upload**: Secure image upload with validation
- **Real-time Progress**: Track generation status
- **Error Handling**: Comprehensive error management
- **Health Monitoring**: Service health checks
- **Cloudflare Tunnel**: Support for remote ComfyUI instances

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or 20+
- ComfyUI server with Flux2 models
- PostgreSQL database
- Redis server

### Installation

1. **Clone the repository** (if not already done)
   ```bash
   git clone https://github.com/your-org/vidrush.git
   cd vidrush
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # apps/backend/.env
   COMFYUI_URL=https://hammer-helmet-sue-hunter.trycloudflare.com
   ```

4. **Start the services**
   ```bash
   # Backend
   cd apps/backend
   npm run dev

   # Frontend
   cd apps/web
   npm run dev
   ```

### Basic Usage

```typescript
import Flux2ImageGenerator from '@/components/youtube/Flux2ImageGenerator'

function MyComponent() {
  return (
    <Flux2ImageGenerator 
      onImageGenerated={(imageUrl) => {
        console.log('Generated:', imageUrl)
      }}
    />
  )
}
```

## 📚 Documentation

### Complete Guides

- **[Complete Documentation](./FLUX2_IMAGE_GENERATION.md)** - Full technical documentation
- **[Quick Start Guide (FR)](./FLUX2_GUIDE_RAPIDE_FR.md)** - French quick start guide
- **[Integration Example](./FLUX2_YOUTUBE_INTEGRATION_EXAMPLE.md)** - Step-by-step integration
- **[Deployment Guide](./FLUX2_DEPLOYMENT_GUIDE.md)** - Production deployment
- **[Implementation Summary](./FLUX2_IMPLEMENTATION_SUMMARY.md)** - What was built

### Quick Links

- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture

```
┌─────────────────┐
│  Web Frontend   │
│   (Next.js)     │
│  localhost:3000 │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   Backend API   │
│   (NestJS)      │
│  localhost:3001 │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│    ComfyUI      │
│   Flux2 Model   │
│  localhost:8188 │
└─────────────────┘
```

### Components

**Backend:**
- `Flux2Service` - Core generation logic
- `Flux2Controller` - REST API endpoints
- `Flux2Module` - NestJS module configuration

**Frontend:**
- `Flux2ImageGenerator` - React component
- `flux2` API client - Type-safe requests

**Infrastructure:**
- ComfyUI server with Flux2 models
- Cloudflare tunnel (optional)
- File storage for uploads

## 🔌 API Reference

### Generate Image

```http
POST /api/flux2/generate
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Parameters:**
- `prompt` (string, required): Image description
- `referenceImage` (file, optional): Reference image
- `width` (number, optional): Image width (default: 1024)
- `height` (number, optional): Image height (default: 1024)
- `steps` (number, optional): Generation steps (default: 8)
- `guidance` (number, optional): Guidance scale (default: 4)
- `seed` (number, optional): Random seed
- `enableTurbo` (boolean, optional): Enable turbo mode (default: true)

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "imagePath": "https://...",
    "width": 1024,
    "height": 1024
  }
}
```

### Health Check

```http
POST /api/flux2/health
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "connected": true,
  "url": "https://hammer-helmet-sue-hunter.trycloudflare.com"
}
```

## 💡 Examples

### Basic Generation

```typescript
import { flux2 } from '@/lib/api'

const formData = new FormData()
formData.append('prompt', 'A beautiful sunset over mountains')
formData.append('enableTurbo', 'true')

const result = await flux2.generateImage(formData)
console.log(result.data.imagePath)
```

### With Reference Image

```typescript
const formData = new FormData()
formData.append('prompt', 'Same scene, different lighting')
formData.append('referenceImage', imageFile)
formData.append('steps', '20')

const result = await flux2.generateImage(formData)
```

### Custom Parameters

```typescript
const formData = new FormData()
formData.append('prompt', 'Professional portrait')
formData.append('width', '1024')
formData.append('height', '1024')
formData.append('steps', '15')
formData.append('guidance', '5')
formData.append('seed', '12345')

const result = await flux2.generateImage(formData)
```

### React Component

```typescript
import Flux2ImageGenerator from '@/components/youtube/Flux2ImageGenerator'

function ThumbnailGenerator() {
  const [thumbnail, setThumbnail] = useState<string | null>(null)

  return (
    <div>
      <Flux2ImageGenerator 
        onImageGenerated={(url) => setThumbnail(url)}
      />
      
      {thumbnail && (
        <img src={thumbnail} alt="Generated" />
      )}
    </div>
  )
}
```

## 🔧 Configuration

### Environment Variables

```env
# ComfyUI Configuration
COMFYUI_URL=https://hammer-helmet-sue-hunter.trycloudflare.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/vidrush

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
```

### Required Models

Install these models in ComfyUI:

1. **UNET**: `flux2_dev_fp8mixed.safetensors`
2. **CLIP**: `mistral_3_small_flux2_bf16.safetensors`
3. **VAE**: `full_encoder_small_decoder.safetensors`
4. **LoRA**: `Flux_2-Turbo-LoRA_comfyui.safetensors`

## 🐛 Troubleshooting

### Common Issues

**ComfyUI Not Responding**
```bash
# Check health
curl https://hammer-helmet-sue-hunter.trycloudflare.com/system_stats
```

**Slow Generation**
- Enable turbo mode
- Reduce steps
- Check GPU resources

**Upload Errors**
- Verify file size < 10MB
- Check file format (PNG, JPG, WEBP)
- Ensure uploads directory exists

### Debug Mode

Enable debug logging:
```typescript
// apps/backend/src/flux2/flux2.service.ts
this.logger.setLogLevels(['debug', 'error', 'warn', 'log']);
```

## 📊 Performance

| Mode | Time | Quality | Use Case |
|------|------|---------|----------|
| Turbo | 30-60s | Good | Quick prototyping |
| Normal | 2-3min | Excellent | Final production |

## 🔐 Security

- ✅ JWT authentication required
- ✅ File type validation
- ✅ File size limits (10MB)
- ✅ Path traversal protection
- ✅ Input sanitization
- ✅ Rate limiting (recommended)

## 🧪 Testing

Run the test suite:

```bash
# Set your JWT token
export TEST_JWT="your-jwt-token"

# Run tests
ts-node test-flux2-service.ts
```

## 📈 Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:3001/api/flux2/health

# ComfyUI health
curl http://localhost:8188/system_stats
```

### Metrics

Monitor these metrics:
- Generation success rate
- Average generation time
- Error rate
- Queue length
- GPU utilization

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) - Powerful UI for Stable Diffusion
- [Flux2](https://huggingface.co/black-forest-labs/FLUX.1-dev) - State-of-the-art image generation model
- [NestJS](https://nestjs.com) - Progressive Node.js framework
- [Next.js](https://nextjs.org) - React framework for production

## 📞 Support

- 📖 [Documentation](./FLUX2_IMAGE_GENERATION.md)
- 🐛 [Issue Tracker](https://github.com/your-org/vidrush/issues)
- 💬 [Discussions](https://github.com/your-org/vidrush/discussions)

## 🗺️ Roadmap

- [ ] Multiple aspect ratios (16:9, 9:16, 1:1, 4:5)
- [ ] Batch generation
- [ ] Style presets
- [ ] Image editing (inpainting, outpainting)
- [ ] Generation history
- [ ] Advanced parameters UI
- [ ] Image variations
- [ ] ControlNet support

---

**Made with ❤️ by the VidRush Team**

**Version:** 1.0.0  
**Last Updated:** 2026-05-06
