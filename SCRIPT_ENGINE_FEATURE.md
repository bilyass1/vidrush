# AI Video Script Engine Feature

## Overview
A full-stack feature that uses Gemini (via OpenRouter) to generate cinematic video scripts with LTX 2.3 prompts, then generates videos using the existing LTX pipeline.

## Architecture

### Backend (NestJS)
**Location:** `apps/backend/src/script-engine/`

**Files Created:**
- `script-engine.module.ts` - Module registration
- `script-engine.controller.ts` - REST API endpoints
- `script-engine.service.ts` - Business logic & Claude integration
- `dto/generate-script.dto.ts` - Request validation
- `interfaces/script-result.interface.ts` - TypeScript interfaces

**Database:**
- Added `ScriptProject` model to Prisma schema
- Tracks: idea, genre, aspectRatio, language, duration, voiceId, generationMode, scriptJson, status, videoJobId

**API Endpoints:**
- `POST /script-engine/generate-script` - Generate script only (for review/edit flow)
- `POST /script-engine/generate-video` - Generate script + immediately trigger video (direct flow)
- `GET /script-engine/status/:projectId` - Poll generation status

**Environment Variables Required:**
- `GEMINI_API_KEY` - OpenRouter API key (required, same key used for free pipeline)

### Frontend (Next.js + React)
**Location:** `apps/web/src/app/dashboard/script-engine/`

**Files Created:**
- `page.tsx` - Main script engine page component

**API Client:**
- Extended `apps/web/src/lib/api.ts` with `scriptEngine` namespace

**Features:**
- Multi-step form (6 steps):
  1. Describe Your Idea (500 char textarea)
  2. Video Genre (10 options: Documentary, Dark History, True Crime, etc.)
  3. Aspect Ratio (16:9, 9:16, 1:1)
  4. Script Language (US English, UK English, French, Arabic)
  5. Duration (8s to 40min slider with snap points)
  6. Voice Model (optional, for future TTS)
- Generation Mode selector (Free vs Premium)
- Two generation flows:
  - **Generate Video Directly** - AI expands idea → generates video (30s max)
  - **Generate Script First** - Review & edit script before generating
- Script review/edit UI with:
  - Editable hook, scenes, loop ending
  - Per-scene narration, positive/negative prompts, duration
  - Add/delete/reorder scenes
  - Drag & drop support (UI ready)

### Integration Points

**Gemini API (via OpenRouter):**
- Model: `google/gemini-2.0-flash-001`
- Uses existing `GEMINI_API_KEY` from `.env`
- System prompt engineered for LTX 2.3 ComfyUI video generation
- Returns structured JSON with:
  - Title, hook, scenes (with positive/negative prompts), loop ending
  - Each scene has: narration, duration, cinematic prompts

**LTX Service:**
- Reuses existing `LtxService` from `video-generation` module
- Generates first scene video using Claude's positive/negative prompts
- Maps aspect ratios to LTX dimensions (divisible by 32)

**WebSocket Gateway:**
- Emits real-time progress updates via existing `VideoGateway`
- Status: PENDING → GENERATING → DONE | FAILED

## Design System

**Colors:**
- Background: `#1a1a2e` (dark navy)
- Cards: `#1e1e2e` with `border-white/10`
- Accent: Purple (`#7c3aed`) and Cyan (`#06b6d4`)
- Selected state: `border-purple-500` with `bg-purple-600/20`

**Components:**
- Step badges: Purple gradient circles with numbers
- Genre cards: 5 per row on desktop, icon + title + subtitle
- Smooth transitions and hover effects
- Dark theme throughout

## Usage Flow

### Direct Generation (30s max):
1. User fills form → clicks "Generate Video Directly"
2. Backend calls Gemini API (via OpenRouter) to generate script
3. Backend immediately triggers LTX for first scene
4. Frontend polls status endpoint
5. Video ready → download/view

### Script-First Generation:
1. User fills form → clicks "Generate Script First"
2. Backend calls Gemini API (via OpenRouter) to generate script
3. Frontend shows script review UI
4. User edits scenes, prompts, reorders, adds/deletes
5. User clicks "Generate Video from Script"
6. Backend triggers LTX with edited prompts
7. Video ready → download/view

## Testing

### Backend:
```bash
cd apps/backend
npm run start:dev
```

Test endpoints:
```bash
# Generate script only
curl -X POST http://localhost:3001/api/script-engine/generate-script \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "idea": "The mysterious story of the Hiroshima bomb",
    "genre": "Documentary",
    "aspectRatio": "16:9",
    "language": "en-us",
    "durationSeconds": 60
  }'

# Generate video directly
curl -X POST http://localhost:3001/api/script-engine/generate-video \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "idea": "A cinematic journey through ancient Rome",
    "genre": "History",
    "aspectRatio": "16:9",
    "language": "en-us",
    "durationSeconds": 30
  }'
```

### Frontend:
```bash
cd apps/web
npm run dev
```

Navigate to: `http://localhost:3000/dashboard/script-engine`

## Dashboard Integration

Added "AI Script Engine" quick action card to main dashboard (`/dashboard`) with cyan accent color.

## Future Enhancements

1. **Voice Integration:** Connect selected voice to TTS generation
2. **Multi-Scene Video:** Generate all scenes, not just first
3. **Script Templates:** Pre-built templates for common genres
4. **Script Library:** Save/load previous scripts
5. **Collaborative Editing:** Share scripts with team
6. **A/B Testing:** Generate multiple script variations
7. **Analytics:** Track which scripts perform best

## Notes

- Direct generation is capped at 30s to keep response times reasonable
- Script-first flow supports full duration range (8s - 40min)
- Voice selection is saved but not yet connected to TTS pipeline
- LTX generates at 25fps with dimensions divisible by 32
- Gemini prompt engineering optimized for cinematic video generation
- Negative prompts help avoid common AI video artifacts

## Dependencies

**Backend:**
- Uses existing `GEMINI_API_KEY` for OpenRouter
- Existing: `@nestjs/common`, `@prisma/client`, `axios`

**Frontend:**
- Existing: `next`, `react`, `lucide-react`, `tailwindcss`

No new dependencies required — uses existing stack.
