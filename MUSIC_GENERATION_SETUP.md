# Music Generation Setup Guide

## Quick Start

Follow these steps to set up the music generation feature:

### 1. Run Database Migration

```bash
cd apps/backend
npx prisma migrate dev --name add_music_project
npx prisma generate
```

This will:
- Add the `MusicProject` table to your database
- Add the `MusicProjectStatus` enum
- Update the Prisma client

### 2. Verify ComfyUI Setup

The music generation feature requires ComfyUI with specific models and nodes.

**Required Model:**
- `ace_step_1.5_turbo_aio.safetensors` (Ace Step 1.5 Turbo All-in-One)

**Required Custom Nodes:**
- TextEncodeAceStepAudio1.5
- EmptyAceStep1.5LatentAudio
- VAEDecodeAudio
- SaveAudioMP3
- ModelSamplingAuraFlow
- ConditioningZeroOut

**Installation:**
```bash
# In your ComfyUI directory
cd custom_nodes
git clone https://github.com/AcestepAudio/ComfyUI-AceStep
cd ComfyUI-AceStep
pip install -r requirements.txt
```

**Download Model:**
Place `ace_step_1.5_turbo_aio.safetensors` in `ComfyUI/models/checkpoints/`

### 3. Test ComfyUI Connection

```bash
# Test if ComfyUI is accessible
curl https://vault-folk-delivery-illustration.trycloudflare.com/system_stats
```

Or update your `LTX_SERVER_URL` in `.env`:
```env
LTX_SERVER_URL=http://localhost:8188
```

### 4. Start the Application

```bash
# Terminal 1 - Backend
cd apps/backend
npm run dev

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

### 5. Access Music Generation

Navigate to: `http://localhost:3000/dashboard/music`

## Testing the Feature

### Test Request (using curl)

```bash
curl -X POST http://localhost:3001/api/music/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "Neo-Soul: A warm, organic neo-soul track with live drums and smooth vocals",
    "lyrics": "[Verse 1]\nLate night glow on your skin\nWindow cracked, city hums again\n\n[Chorus]\nStay right there, dont pull it straight\nI love how we arrive late",
    "duration": 60,
    "bpm": 120,
    "keyScale": "E minor",
    "timeSignature": "4",
    "language": "en"
  }'
```

### Test via UI

1. Login to the dashboard
2. Click "Music Gen" in the sidebar
3. Fill in the form:
   - **Prompt**: Describe your music style
   - **Lyrics**: Write your song lyrics
   - **Settings**: Adjust duration, BPM, key, etc.
4. Click "Generate Music"
5. Wait for generation (2-5 minutes)
6. Play and download your music

## Troubleshooting

### Issue: "Music generation failed"

**Possible causes:**
1. ComfyUI is not running
2. Required models/nodes are missing
3. Network connectivity issues

**Solutions:**
```bash
# Check ComfyUI status
curl http://localhost:8188/system_stats

# Check ComfyUI logs
cd ComfyUI
tail -f comfyui.log

# Verify model exists
ls ComfyUI/models/checkpoints/ace_step_1.5_turbo_aio.safetensors
```

### Issue: "Music generation timed out"

**Possible causes:**
1. ComfyUI is overloaded
2. Duration is too long
3. System resources are insufficient

**Solutions:**
- Reduce duration to 60-120 seconds
- Reduce steps to 4-8
- Check ComfyUI GPU/CPU usage
- Restart ComfyUI

### Issue: Database migration fails

**Solution:**
```bash
# Reset database (WARNING: deletes all data)
cd apps/backend
npx prisma migrate reset

# Or manually apply migration
npx prisma db push
```

### Issue: "Module not found: music-generation"

**Solution:**
```bash
# Rebuild backend
cd apps/backend
npm run build

# Restart dev server
npm run dev
```

## Configuration Options

### Environment Variables

```env
# Backend (.env)
LTX_SERVER_URL=http://localhost:8188
DATABASE_URL=postgresql://user:pass@localhost:5432/vidrush
REDIS_HOST=localhost
REDIS_PORT=6379

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Default Settings

You can modify default values in `apps/backend/src/music-generation/dto/generate-music.dto.ts`:

```typescript
// Example: Change default BPM
@IsOptional()
@Type(() => Number)
@IsNumber()
@Min(60)
@Max(240)
bpm?: number = 120; // Changed from 190
```

## API Documentation

### Generate Music
```
POST /api/music/generate
Authorization: Bearer <token>
Content-Type: application/json

Body: {
  prompt: string (10-1000 chars)
  lyrics: string (10-5000 chars)
  seed?: number (1-999999)
  steps?: number (1-50, default: 8)
  cfg?: number (0-20, default: 1)
  shift?: number (0-10, default: 3)
  duration?: number (30-300, default: 120)
  bpm?: number (60-240, default: 190)
  timeSignature?: string ("4"|"3"|"6"|"5"|"7", default: "4")
  language?: string ("en"|"fr"|"es"|"de"|"it"|"pt", default: "en")
  keyScale?: string (default: "E minor")
  cfgScale?: number (0-10, default: 2)
  temperature?: number (0-1, default: 0.85)
  topP?: number (0-1, default: 0.9)
  topK?: number (0+, default: 0)
  minP?: number (0-1, default: 0)
}

Response: {
  jobId: string
  musicProjectId: string
  status: "PENDING"
}
```

### Check Status
```
GET /api/music/status/:projectId
Authorization: Bearer <token>

Response: {
  status: "PENDING" | "GENERATING" | "DONE" | "FAILED"
  audioUrl?: string
  prompt: string
  lyrics: string
}
```

### List Projects
```
GET /api/music/list
Authorization: Bearer <token>

Response: [
  {
    id: string
    prompt: string
    status: string
    audioUrl?: string
    createdAt: string
    ...
  }
]
```

## Performance Tips

1. **Faster Generation:**
   - Use fewer steps (4-8)
   - Shorter duration (30-60s)
   - Lower temperature (0.7-0.8)

2. **Better Quality:**
   - More steps (12-20)
   - Higher CFG scale (3-5)
   - Detailed prompt

3. **Reproducibility:**
   - Use same seed value
   - Keep all parameters identical

## Next Steps

After setup, you can:
1. Generate your first music track
2. Experiment with different styles and settings
3. Integrate music with video generation
4. Build a music library
5. Share generated music

## Support

For issues or questions:
1. Check ComfyUI logs
2. Check backend logs (`apps/backend`)
3. Check browser console for frontend errors
4. Review the MUSIC_GENERATION_FEATURE.md documentation
