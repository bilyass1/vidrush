# Music Generation - Quick Start Guide

## 🚀 Setup (5 minutes)

### Step 1: Database Migration
```bash
cd apps/backend
npx prisma migrate dev --name add_music_project
npx prisma generate
```

### Step 2: Verify ComfyUI
Ensure you have:
- ✅ ComfyUI running (http://localhost:8188 or cloudflare tunnel)
- ✅ Model: `ace_step_1.5_turbo_aio.safetensors` in `models/checkpoints/`
- ✅ Custom nodes: ComfyUI-AceStep installed

### Step 3: Start Application
```bash
# Terminal 1 - Backend
cd apps/backend && npm run dev

# Terminal 2 - Frontend  
cd apps/web && npm run dev
```

### Step 4: Access Feature
Open: http://localhost:3000/dashboard/music

## 🎵 Usage

1. **Describe Your Music** (Prompt)
   ```
   Neo-Soul: A warm, organic neo-soul track with live drums,
   smooth bass, and soulful vocals. Relaxed tempo with jazzy chords.
   ```

2. **Write Lyrics**
   ```
   [Verse 1]
   Late night glow on your skin
   Window cracked, city hums again
   
   [Chorus]
   Stay right there, don't pull it straight
   I love how we arrive late
   ```

3. **Configure Settings**
   - Duration: 120 seconds
   - BPM: 120
   - Key: E minor
   - Time Signature: 4/4
   - Language: English

4. **Generate** → Wait 2-5 minutes → **Play & Download**

## 📁 Files Created

### Backend
```
apps/backend/src/music-generation/
├── music-generation.controller.ts
├── music-generation.service.ts
├── music-generation.module.ts
├── dto/
│   └── generate-music.dto.ts
└── interfaces/
    └── music-result.interface.ts
```

### Frontend
```
apps/web/src/app/dashboard/music/
└── page.tsx
```

### Database
```
apps/backend/prisma/schema.prisma
└── MusicProject model added
```

## 🔧 API Endpoints

```bash
# Generate music
POST /api/music/generate
Authorization: Bearer <token>
Body: { prompt, lyrics, duration, bpm, ... }

# Check status
GET /api/music/status/:projectId
Authorization: Bearer <token>

# List projects
GET /api/music/list
Authorization: Bearer <token>
```

## ⚡ Quick Test

```bash
# Test with curl (replace YOUR_TOKEN)
curl -X POST http://localhost:3001/api/music/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "prompt": "Chill lofi hip-hop beat with piano and soft drums",
    "lyrics": "[Instrumental]\nRelaxing vibes\nStudy time",
    "duration": 60,
    "bpm": 90
  }'
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "musicProject does not exist" | Run `npx prisma generate` |
| "Music generation failed" | Check ComfyUI is running |
| "Generation timed out" | Reduce duration or steps |
| "Model not found" | Download ace_step_1.5_turbo_aio.safetensors |

## 📚 Documentation

- **Full Feature Docs**: `MUSIC_GENERATION_FEATURE.md`
- **Setup Guide**: `MUSIC_GENERATION_SETUP.md`
- **Summary**: `MUSIC_GENERATION_SUMMARY.md`

## ✨ Features

✅ AI-generated music with vocals  
✅ Full control over music parameters  
✅ Real-time progress tracking  
✅ Audio player with download  
✅ Advanced settings panel  
✅ Mobile responsive UI  
✅ User authentication  
✅ Project history  

## 🎯 Next Steps

1. Run the database migration
2. Test the feature
3. Generate your first track
4. Experiment with different styles
5. Integrate with video generation

**That's it! You're ready to create AI music! 🎵**
