# VidRush – Master Spec

## What is VidRush?
A desktop app (Tauri v2) that lets creators generate full YouTube documentaries and e-commerce product ads using AI – then edit and publish them, all from one place.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 + React + Tailwind CSS + shadcn/ui |
| Desktop | Tauri v2 (Rust) |
| Backend | NestJS + Prisma + PostgreSQL |
| Video Processing | FFmpeg local via Tauri Rust commands |
| Queue | Bull + Redis |
| Real-time | Socket.io WebSocket |
| Auth | JWT + OAuth2 Google |
| Billing | Stripe |
| Storage | AWS S3 |
| Deploy | Vercel (frontend) + AWS EC2 (backend) |

---

## APIs Used

| API | Purpose |
|---|---|
| Grok 4.1 Fast | Script generation |
| ElevenLabs Flash | Voice synthesis |
| Veo 3.1 (Google Vertex AI) | Video clip generation |
| Shotstack | Video rendering + assembly |
| Flux 1.1 Pro | Lifestyle image generation (e-commerce) |
| Kling 3.0 | Product animation (e-commerce) |
| Claid API | Background removal |
| YouTube Data API v3 | Upload + analytics |

---

## Project Structure

```
vidrush/
├── apps/
│   ├── web/          → Next.js 15 (marketing site + auth pages)
│   ├── desktop/      → Tauri v2 (main app, points to apps/web)
│   └── backend/      → NestJS (REST API + WebSocket)
├── packages/
│   └── shared/       → Shared TypeScript types
├── turbo.json
└── package.json      → Root npm workspaces
```

---

## Modules

### 1. Auth
- JWT access + refresh tokens
- Google OAuth2 (for YouTube connection)
- NestJS Guards: JwtAuthGuard, PlanGuard

### 2. Billing
- Plans:
  - FREE: limited preview
  - STARTER: $29/mo → 15 min/mo
  - PRO: $79/mo → 50 min/mo
  - PAYG: $1.50/min
- Stripe Checkout + Customer Portal + Webhooks
- UsageService tracks minutes consumed per user per month

### 3. YouTube Generator
- Pipeline: Grok script → ElevenLabs voice → Veo clips → Shotstack render
- Chunked rendering: 5min segments, 12 parallel workers
- Bull queue for async processing
- WebSocket progress events: PENDING → SCRIPTING → VOICING → GENERATING → RENDERING → DONE

### 4. E-Commerce Studio
- Input: product photos + idea + market (US / EU / TN)
- Pipeline: Claid (bg removal) → Flux (lifestyle scenes) → Kling (animation) → Grok (ad script) → ElevenLabs (voice) → Shotstack (assembly)
- Output: 9:16, 1:1, 16:9 video formats + social media posters
- Market-specific localisation:
  - US: English, minimalist studio style
  - EU: French, Parisian interior style
  - TN: Tunisian Darija Arabic, warm Mediterranean style

### 5. Video Editor (FFmpeg local)
- Tauri Rust commands: extract_thumbnails, get_video_info, cut_video, export_with_effects
- React components: VideoPlayer, Timeline, StickerPanel, VideoOverlay, ExportModal
- useEditor.ts central hook
- 50+ stickers in /assets/stickers/ (Emojis, Shapes, Decorations)
- Export formats: MP4 H264, WebM, original

### 6. YouTube Publisher
- OAuth2 scopes: youtube.upload, youtube.readonly, yt-analytics.readonly
- Resumable upload with thumbnail support
- Analytics dashboard: views, watch time, likes, CTR, top countries

---

## Database Models (Prisma)

```
User                → id, email, name, passwordHash, plan, stripeCustomerId, youtubeRefreshToken
Subscription        → userId, plan, status, stripeSubscriptionId, currentPeriodEnd
VideoGeneration     → id, userId, type, status, inputPrompt, outputUrl, durationMin, costUsd
VideoProject        → id, userId, title, timeline(JSON), exportUrl
YoutubeChannel      → id, userId, channelId, refreshToken, accessToken, tokenExpiry
EcommerceSet        → id, userId, productName, market, inputImages[], outputPosters[], outputVideos[], scriptText, price
```

**Enums:**
- Plan: FREE | STARTER | PRO | PAYG
- VideoType: YOUTUBE | ECOMMERCE
- VideoStatus: PENDING | SCRIPTING | VOICING | GENERATING | RENDERING | DONE | FAILED
- SubscriptionStatus: ACTIVE | CANCELED | PAST_DUE
- Market: US | EU | TN

---

## Dashboard Routes (Desktop App)

| Route | Page |
|---|---|
| /dashboard | Overview – stats + recent videos |
| /dashboard/youtube | YouTube Generator |
| /dashboard/ecommerce | E-Commerce Studio |
| /dashboard/editor | Video Editor |
| /dashboard/analytics | YouTube Analytics |
| /dashboard/settings | Profile + billing + YouTube connect |

---

## Backend API Endpoints

### Auth
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- GET  /auth/google
- GET  /auth/google/callback

### Billing
- POST /billing/create-checkout
- POST /billing/webhook
- GET  /billing/portal

### Video Generation
- POST /video/generate
- GET  /video/status/:jobId
- GET  /video/:id

### YouTube
- GET  /youtube/auth
- GET  /youtube/callback
- POST /youtube/upload
- GET  /youtube/analytics/:videoId

### E-Commerce
- POST /ecommerce/generate

---

## Tauri Rust Commands

| Command | Description |
|---|---|
| check_ffmpeg() | Check FFmpeg is installed |
| extract_thumbnails(path, dir, count) | Extract N thumbnails from video |
| get_video_info(path) | Returns duration, width, height, fps |
| cut_video(input, output, start, end) | Cut video without re-encoding |
| export_with_effects(instructions) | Full export with cuts, overlays, volume, speed |
| save_file(path, data) | Save file locally |
| open_folder(path) | Open folder in system explorer |
| get_app_version() | Return app version string |
| send_notification(title, body) | Native system notification |

---

## Tauri Config

```json
{
  "identifier": "com.vidrush.app",
  "productName": "VidRush",
  "version": "1.0.0",
  "permissions": ["fs", "shell", "dialog", "notification", "http", "process", "updater"],
  "updater": {
    "endpoint": "https://vidrush.com/releases/{{target}}/{{arch}}/latest.json"
  }
}
```

---

## Environment Variables (.env.production)

```
DATABASE_URL
JWT_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
GROK_API_KEY
ELEVENLABS_API_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
AWS_ACCESS_KEY
AWS_SECRET_KEY
S3_BUCKET_NAME
SHOTSTACK_API_KEY
REDIS_URL
```

---

## Build & Distribution

- Windows: `.msi` + `.exe` via NSIS installer
- macOS: `.dmg` Universal (Intel + Apple Silicon)
- Code signing configured per platform
- Auto-updater via endpoint above

---

## Coding Rules

- Always TypeScript strict mode – no `any`
- Prisma for all DB access
- Zod for all input validation
- DTOs with class-validator in NestJS
- Tests required on: auth module, billing module, video generation pipeline
- Sessions with Claude Code: max 30–45 min, one module at a time
- Always provide VIDRUSH_SPEC.md at the start of each session

---

## Build Timeline

| Phase | Content | Days |
|---|---|---|
| 0 | Preparation + spec | J1 |
| 1 | Foundation: monorepo, DB, auth, billing, site | J2–6 |
| 2 | Tauri setup + FFmpeg + Dashboard | J7–10 |
| 3 | YouTube Generator pipeline | J11–16 |
| 4 | YouTube Publisher + Analytics | J17–19 |
| 5 | E-Commerce Studio | J20–24 |
| 6 | Video Editor complete | J25–28 |
| 7 | Build, deploy, Product Hunt launch | J29–32 |
| **Total** | **Complete MVP** | **~32 days** |

---

## Session Starter Template

Paste this at the beginning of every Claude Code session:

```
Read VIDRUSH_SPEC.md before starting.
Current module: [module name]
Current state: [what is already done]
Goal for this session: [what we want to finish]
```
