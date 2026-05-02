# VidRush Architecture

## Overview
VidRush is a video generation platform with three main components:
1. **Web Frontend** (Next.js) - User interface
2. **Backend API** (NestJS) - Business logic and API gateway
3. **LTX/ComfyUI Server** - AI video generation service

## Network Architecture

```
┌─────────────────┐
│  Web Frontend   │
│   (Next.js)     │
│  localhost:3000 │
└────────┬────────┘
         │ HTTP/WebSocket
         │ (CORS allowed)
         ▼
┌─────────────────┐
│   Backend API   │
│   (NestJS)      │
│  localhost:3001 │
└────────┬────────┘
         │ HTTP
         │ (No CORS issues)
         ▼
┌─────────────────┐
│  LTX/ComfyUI    │
│     Server      │
│ vault-folk...   │
│ trycloudflare   │
└─────────────────┘
```

## Key Endpoints

### Frontend → Backend
- `GET /api/video/api-status` - Check LTX server health
- `POST /api/video/generate` - Start video generation
- `GET /api/video/status/:jobId` - Check generation status
- `GET /api/video/list` - List user videos
- `GET /api/video/stats` - Get user statistics

### Backend → LTX Server
- `GET https://vault-folk-delivery-illustration.trycloudflare.com/system_stats` - Health check
- `POST https://vault-folk-delivery-illustration.trycloudflare.com/generate` - Generate video clip
- `GET https://vault-folk-delivery-illustration.trycloudflare.com/video/:jobId` - Download video
- `DELETE https://vault-folk-delivery-illustration.trycloudflare.com/video/:jobId` - Delete video

## Configuration

### Backend (.env)
```env
LTX_SERVER_URL="https://vault-folk-delivery-illustration.trycloudflare.com"
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Desktop App (Rust)
```rust
const COMFY_URL: &str = "https://vault-folk-delivery-illustration.trycloudflare.com";
```

## Why This Architecture?

### CORS Protection
- Frontend cannot directly call LTX server due to CORS restrictions
- Backend acts as a proxy, eliminating CORS issues
- All external API calls go through the backend

### Security
- LTX server credentials/config stay on backend
- Frontend only needs backend API token
- Rate limiting and auth handled by backend

### Flexibility
- Easy to switch LTX server without frontend changes
- Backend can implement caching, retries, fallbacks
- Centralized logging and monitoring

## Desktop App Architecture

The desktop app (Tauri) has a different architecture:
- Runs locally on user's machine
- Rust backend can directly call ComfyUI (no CORS)
- Used for local video generation and testing
- Does not require the NestJS backend for video generation

## Health Check Flow

1. Frontend calls: `GET /api/video/api-status`
2. Backend calls: `GET https://vault-folk-delivery-illustration.trycloudflare.com/system_stats`
3. Backend returns: `{ ltxServer: { connected: true/false, url: "..." } }`
4. Frontend displays connection status

## Video Generation Flow

1. User submits prompt on frontend
2. Frontend calls: `POST /api/video/generate`
3. Backend queues job in Bull/Redis
4. Worker picks up job
5. Worker calls LTX service multiple times for each scene
6. LTX service calls: `POST https://vault-folk-delivery-illustration.trycloudflare.com/generate`
7. Backend assembles clips with FFmpeg
8. Backend stores final video
9. WebSocket notifies frontend of completion

## Important Notes

- **Never expose LTX server URL to frontend** - Always proxy through backend
- **Desktop app is independent** - It has its own direct connection to ComfyUI
- **Health checks use `/system_stats`** - ComfyUI's standard health endpoint
- **All video generation goes through backend** - Except desktop app local generation
