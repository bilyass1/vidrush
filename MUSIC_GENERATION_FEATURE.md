# Music Generation Feature

## Overview
The Music Generation module allows users to create AI-generated music with vocals by providing a description of the music style and lyrics. The system uses ComfyUI with the Ace Step 1.5 Turbo model to generate complete audio tracks.

## Architecture

### Backend Components

#### 1. Music Generation Module (`apps/backend/src/music-generation/`)
- **Controller**: `music-generation.controller.ts` - REST API endpoints
- **Service**: `music-generation.service.ts` - Business logic and ComfyUI integration
- **DTOs**: `dto/generate-music.dto.ts` - Request validation
- **Interfaces**: `interfaces/music-result.interface.ts` - Type definitions

#### 2. Database Schema
Added `MusicProject` model to Prisma schema:
```prisma
model MusicProject {
  id            String             @id @default(cuid())
  userId        String
  prompt        String
  lyrics        String             @db.Text
  seed          Int
  steps         Int
  cfg           Float
  shift         Float
  duration      Int
  bpm           Int
  timeSignature String
  language      String
  keyScale      String
  cfgScale      Float
  temperature   Float
  topP          Float
  topK          Int
  minP          Float
  status        MusicProjectStatus @default(PENDING)
  audioUrl      String?
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt
  user          User               @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Frontend Components

#### Music Generation Page (`apps/web/src/app/dashboard/music/page.tsx`)
- User interface for music generation
- Form inputs for prompt, lyrics, and settings
- Real-time progress tracking
- Audio player for generated music
- Download functionality

#### Sidebar Integration
Updated `apps/web/src/components/dashboard/Sidebar.tsx` to include "Music Gen" navigation link.

## API Endpoints

### POST `/api/music/generate`
Generate music from prompt and lyrics.

**Request Body:**
```json
{
  "prompt": "Neo-Soul: A warm, organic neo-soul track...",
  "lyrics": "[Verse 1]\nLate night glow on your skin...",
  "seed": 31,
  "steps": 8,
  "cfg": 1,
  "shift": 3,
  "duration": 120,
  "bpm": 190,
  "timeSignature": "4",
  "language": "en",
  "keyScale": "E minor",
  "cfgScale": 2,
  "temperature": 0.85,
  "topP": 0.9,
  "topK": 0,
  "minP": 0
}
```

**Response:**
```json
{
  "jobId": "clx...",
  "musicProjectId": "clx...",
  "status": "PENDING"
}
```

### GET `/api/music/status/:projectId`
Check generation status.

**Response:**
```json
{
  "status": "DONE",
  "audioUrl": "https://...",
  "prompt": "...",
  "lyrics": "..."
}
```

### GET `/api/music/list`
List user's music projects.

**Response:**
```json
[
  {
    "id": "clx...",
    "prompt": "...",
    "status": "DONE",
    "audioUrl": "...",
    "createdAt": "2026-05-06T..."
  }
]
```

## ComfyUI Workflow

The service generates a ComfyUI workflow with the following nodes:

1. **CheckpointLoaderSimple (97)**: Loads `ace_step_1.5_turbo_aio.safetensors`
2. **TextEncodeAceStepAudio1.5 (94)**: Encodes prompt and lyrics with music parameters
3. **EmptyAceStep1.5LatentAudio (98)**: Creates empty latent audio
4. **ModelSamplingAuraFlow (78)**: Applies model sampling with shift parameter
5. **ConditioningZeroOut (47)**: Zeros out negative conditioning
6. **KSampler (3)**: Samples the latent with specified steps, CFG, seed
7. **VAEDecodeAudio (18)**: Decodes latent to audio
8. **SaveAudioMP3 (104)**: Saves as MP3 file

## User Configurable Parameters

### Basic Settings
- **Prompt** (10-1000 chars): Description of music style, instruments, mood
- **Lyrics** (10-5000 chars): Song lyrics with verse/chorus structure
- **Duration** (30-300s): Length of the track
- **BPM** (60-240): Tempo/beats per minute
- **Key Scale**: Musical key (C major, E minor, etc.)
- **Time Signature**: 4/4, 3/4, 6/8, etc.
- **Language**: en, fr, es, de, it, pt
- **Seed**: Random seed for reproducibility

### Advanced Settings
- **Steps** (1-50): Number of sampling steps (default: 8)
- **CFG** (0-20): Classifier-free guidance (default: 1)
- **Shift** (0-10): Model sampling shift (default: 3)
- **CFG Scale** (0-10): Conditioning scale (default: 2)
- **Temperature** (0-1): Sampling temperature (default: 0.85)
- **Top P** (0-1): Nucleus sampling (default: 0.9)
- **Top K** (0+): Top-k sampling (default: 0)
- **Min P** (0-1): Minimum probability (default: 0)

## Setup Instructions

### 1. Database Migration
Run Prisma migration to add the MusicProject table:
```bash
cd apps/backend
npx prisma migrate dev --name add_music_project
npx prisma generate
```

### 2. ComfyUI Setup
Ensure ComfyUI has the following installed:
- Ace Step 1.5 Turbo model: `ace_step_1.5_turbo_aio.safetensors`
- Required custom nodes:
  - `TextEncodeAceStepAudio1.5`
  - `EmptyAceStep1.5LatentAudio`
  - `VAEDecodeAudio`
  - `SaveAudioMP3`

### 3. Environment Variables
The service uses the existing `LTX_SERVER_URL` environment variable to connect to ComfyUI.

### 4. Start Services
```bash
# Backend
cd apps/backend
npm run dev

# Frontend
cd apps/web
npm run dev
```

## Usage Flow

1. User navigates to `/dashboard/music`
2. User enters music description and lyrics
3. User configures settings (duration, BPM, key, etc.)
4. User clicks "Generate Music"
5. Backend creates MusicProject record
6. Backend sends workflow to ComfyUI
7. Backend polls ComfyUI for completion
8. Frontend polls backend for status updates
9. When complete, audio player displays with download option

## Example Prompt & Lyrics

**Prompt:**
```
Neo-Soul: A warm, organic neo-soul track dripping with live instrumentation and effortless groove. A live drummer plays a loose, hip-hop influenced pocket—soft kick drum with lazy swing, snare hits that sit just behind the beat, and brushed hi-hats that breathe and shuffle with human imperfection.
```

**Lyrics:**
```
[Intro - Guitar Riff & Drums]
mm…
yeah…
let it breathe…

[Verse 1]
Late night glow on your skin  
Window cracked, city hums again  
Coffee rings on the table top  
Time don't rush, it just drops  

[Chorus]
Stay right there, don't pull it straight  
I love how we arrive late  
Off the grid but locked in time  
That lazy swing feels like mine  

[Outro - Guitar Riff & Final Chord]
no rush…
no rush…
just groove…
```

## Error Handling

- Validates prompt and lyrics minimum length (10 chars)
- Validates all numeric parameters within acceptable ranges
- Handles ComfyUI connection failures
- Implements timeout (5 minutes) for generation
- Updates project status to FAILED on errors
- Emits WebSocket progress updates to frontend

## Future Enhancements

- [ ] Support for multiple music styles/genres presets
- [ ] AI-powered lyrics generation
- [ ] Music editing and remixing
- [ ] Batch generation
- [ ] Music library with search and filtering
- [ ] Export to different formats (WAV, FLAC, OGG)
- [ ] Integration with video generation for soundtracks
- [ ] Collaborative music projects
- [ ] Music visualization

## Notes

- Generation time varies based on duration and quality settings (typically 2-5 minutes)
- Longer durations require more processing time
- The Ace Step 1.5 Turbo model is optimized for fast generation
- Audio quality is set to V0 (high quality VBR MP3)
- The system supports multiple concurrent generations
