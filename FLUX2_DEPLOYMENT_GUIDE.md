# Flux2 Image Generation - Deployment Guide

## Prerequisites

### ComfyUI Server Requirements

1. **Hardware:**
   - GPU: NVIDIA GPU with at least 8GB VRAM (12GB+ recommended)
   - RAM: 16GB minimum (32GB recommended)
   - Storage: 50GB+ for models

2. **Software:**
   - Python 3.10+
   - CUDA 11.8+ or 12.1+
   - ComfyUI installed and running

3. **Models Required:**
   ```
   ComfyUI/models/
   ├── unet/
   │   └── flux2_dev_fp8mixed.safetensors
   ├── clip/
   │   └── mistral_3_small_flux2_bf16.safetensors
   ├── vae/
   │   └── full_encoder_small_decoder.safetensors
   └── loras/
       └── Flux_2-Turbo-LoRA_comfyui.safetensors
   ```

4. **Custom Nodes:**
   - ComfySwitchNode
   - Flux2Scheduler
   - EmptyFlux2LatentImage
   - ReferenceLatent
   - ImageScaleToTotalPixels

### Backend Requirements

1. **Node.js:** v18+ or v20+
2. **Dependencies:** All installed via `npm install`
3. **Environment Variables:** Properly configured

## Deployment Steps

### 1. ComfyUI Setup

#### Install ComfyUI
```bash
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
pip install -r requirements.txt
```

#### Download Models
```bash
# Create model directories
mkdir -p models/unet models/clip models/vae models/loras

# Download models (example using wget)
cd models/unet
wget https://huggingface.co/black-forest-labs/FLUX.1-dev/resolve/main/flux2_dev_fp8mixed.safetensors

cd ../clip
wget https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/mistral_3_small_flux2_bf16.safetensors

cd ../vae
wget https://huggingface.co/black-forest-labs/FLUX.1-dev/resolve/main/full_encoder_small_decoder.safetensors

cd ../loras
wget https://huggingface.co/ByteDance/Hyper-SD/resolve/main/Flux_2-Turbo-LoRA_comfyui.safetensors
```

#### Install Custom Nodes
```bash
cd ComfyUI/custom_nodes

# Install required custom nodes
git clone https://github.com/rgthree/rgthree-comfy.git
git clone https://github.com/ltdrdata/ComfyUI-Manager.git

# Install dependencies
cd rgthree-comfy && pip install -r requirements.txt
cd ../ComfyUI-Manager && pip install -r requirements.txt
```

#### Start ComfyUI
```bash
cd ComfyUI
python main.py --listen 0.0.0.0 --port 8188
```

### 2. Cloudflare Tunnel Setup (Optional)

If you need to expose ComfyUI to the internet:

```bash
# Install cloudflared
# Windows
winget install --id Cloudflare.cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Start tunnel
cloudflared tunnel --url http://localhost:8188
```

Copy the generated URL (e.g., `https://hammer-helmet-sue-hunter.trycloudflare.com`)

### 3. Backend Configuration

#### Environment Variables

Create or update `apps/backend/.env`:

```env
# ComfyUI Configuration
COMFYUI_URL=https://hammer-helmet-sue-hunter.trycloudflare.com

# Or for local development
# COMFYUI_URL=http://localhost:8188

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/vidrush

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Other services...
```

#### Install Dependencies

```bash
cd apps/backend
npm install
```

#### Create Upload Directory

```bash
mkdir -p uploads/flux2-references
```

#### Build and Start

```bash
# Development
npm run dev

# Production
npm run build
npm run start:prod
```

### 4. Frontend Configuration

#### Environment Variables

Create or update `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Or for production
# NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

#### Install Dependencies

```bash
cd apps/web
npm install
```

#### Build and Start

```bash
# Development
npm run dev

# Production
npm run build
npm run start
```

## Production Deployment

### Docker Deployment

#### ComfyUI Dockerfile

```dockerfile
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    git \
    wget

WORKDIR /app

RUN git clone https://github.com/comfyanonymous/ComfyUI.git
WORKDIR /app/ComfyUI

RUN pip install -r requirements.txt

# Copy models (or mount as volume)
COPY models/ /app/ComfyUI/models/

EXPOSE 8188

CMD ["python3", "main.py", "--listen", "0.0.0.0", "--port", "8188"]
```

#### Backend Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  comfyui:
    build: ./comfyui
    ports:
      - "8188:8188"
    volumes:
      - ./comfyui/models:/app/ComfyUI/models
      - ./comfyui/output:/app/ComfyUI/output
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  backend:
    build: ./apps/backend
    ports:
      - "3001:3001"
    environment:
      - COMFYUI_URL=http://comfyui:8188
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_HOST=redis
    depends_on:
      - comfyui
      - postgres
      - redis

  frontend:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001/api
    depends_on:
      - backend

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=vidrush
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment

#### ComfyUI Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: comfyui
spec:
  replicas: 1
  selector:
    matchLabels:
      app: comfyui
  template:
    metadata:
      labels:
        app: comfyui
    spec:
      containers:
      - name: comfyui
        image: your-registry/comfyui:latest
        ports:
        - containerPort: 8188
        resources:
          limits:
            nvidia.com/gpu: 1
        volumeMounts:
        - name: models
          mountPath: /app/ComfyUI/models
      volumes:
      - name: models
        persistentVolumeClaim:
          claimName: comfyui-models-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: comfyui
spec:
  selector:
    app: comfyui
  ports:
  - port: 8188
    targetPort: 8188
```

## Monitoring and Logging

### Health Checks

Add health check endpoints:

```typescript
// apps/backend/src/flux2/flux2.controller.ts

@Get('health')
async healthCheck() {
  const isHealthy = await this.flux2Service.checkHealth();
  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
  };
}
```

### Logging

Configure logging in production:

```typescript
// apps/backend/src/main.ts

import { Logger } from '@nestjs/common';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  
  // ... rest of configuration
  
  await app.listen(3001);
  logger.log('Application is running on: http://localhost:3001');
}
```

### Prometheus Metrics

Add metrics collection:

```typescript
import { Counter, Histogram } from 'prom-client';

const imageGenerationCounter = new Counter({
  name: 'flux2_image_generation_total',
  help: 'Total number of image generations',
});

const imageGenerationDuration = new Histogram({
  name: 'flux2_image_generation_duration_seconds',
  help: 'Duration of image generation',
});
```

## Performance Optimization

### 1. Caching

Implement Redis caching for generated images:

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class Flux2Service {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async generateImage(req: Flux2GenerateRequest) {
    const cacheKey = `flux2:${req.prompt}:${req.seed}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const result = await this.generateImageInternal(req);
    await this.cacheManager.set(cacheKey, result, 3600); // 1 hour
    
    return result;
  }
}
```

### 2. Queue Management

Use Bull for job queuing:

```typescript
@Processor('flux2-generation')
export class Flux2Processor {
  @Process('generate-image')
  async handleGeneration(job: Job) {
    const result = await this.flux2Service.generateImage(job.data);
    return result;
  }
}
```

### 3. Load Balancing

Use multiple ComfyUI instances:

```typescript
const COMFYUI_INSTANCES = [
  'http://comfyui-1:8188',
  'http://comfyui-2:8188',
  'http://comfyui-3:8188',
];

let currentInstance = 0;

function getNextInstance() {
  const instance = COMFYUI_INSTANCES[currentInstance];
  currentInstance = (currentInstance + 1) % COMFYUI_INSTANCES.length;
  return instance;
}
```

## Security Considerations

### 1. Rate Limiting

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10, // 10 requests per minute
    }),
  ],
})
export class Flux2Module {}
```

### 2. File Upload Security

```typescript
const multerOptions = {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
};
```

### 3. Input Validation

```typescript
@IsString()
@MinLength(3)
@MaxLength(1000)
prompt: string;

@IsOptional()
@IsNumber()
@Min(512)
@Max(2048)
width?: number;
```

## Backup and Recovery

### Database Backups

```bash
# Backup
pg_dump -U user vidrush > backup.sql

# Restore
psql -U user vidrush < backup.sql
```

### Model Backups

```bash
# Backup models
tar -czf models-backup.tar.gz ComfyUI/models/

# Restore models
tar -xzf models-backup.tar.gz -C ComfyUI/
```

## Troubleshooting

### ComfyUI Not Starting

```bash
# Check GPU
nvidia-smi

# Check Python version
python --version

# Check dependencies
pip list | grep torch
```

### Backend Connection Issues

```bash
# Test ComfyUI endpoint
curl http://localhost:8188/system_stats

# Check backend logs
tail -f logs/backend.log

# Test backend endpoint
curl http://localhost:3001/api/flux2/health
```

### Performance Issues

```bash
# Monitor GPU usage
watch -n 1 nvidia-smi

# Monitor memory
free -h

# Monitor disk I/O
iostat -x 1
```

## Maintenance

### Regular Tasks

1. **Daily:**
   - Check error logs
   - Monitor disk space
   - Verify service health

2. **Weekly:**
   - Review performance metrics
   - Clean up old generated images
   - Update dependencies

3. **Monthly:**
   - Database maintenance
   - Model updates
   - Security patches

### Cleanup Script

```bash
#!/bin/bash
# cleanup-old-images.sh

# Remove images older than 7 days
find uploads/flux2-references -type f -mtime +7 -delete

# Remove ComfyUI output older than 7 days
find ComfyUI/output -type f -mtime +7 -delete

echo "Cleanup completed"
```

## Support and Resources

- [ComfyUI Documentation](https://github.com/comfyanonymous/ComfyUI)
- [Flux2 Model](https://huggingface.co/black-forest-labs/FLUX.1-dev)
- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Last Updated:** 2026-05-06
