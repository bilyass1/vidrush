# Script Engine - Flux de Génération Directe

## 🎯 Architecture Complète avec Gemini

Quand l'utilisateur clique sur **"Generate Video Directly"**, voici le flux complet:

### 1️⃣ Frontend → Backend (Requête initiale)
```typescript
// apps/web/src/app/dashboard/script-engine/page.tsx
const result = await scriptEngine.generateVideo({
  idea: "The mysterious story of the Hiroshima bomb",
  genre: "Documentary",
  aspectRatio: "16:9",
  language: "en-us",
  durationSeconds: 30,
  voiceId: "optional-voice-id",
  generationMode: "free"
})
```

**Message affiché:** "Gemini développe votre idée..."

### 2️⃣ Backend - Création du Projet
```typescript
// apps/backend/src/script-engine/script-engine.service.ts
const project = await this.prisma.scriptProject.create({
  data: {
    userId,
    idea: dto.idea,
    genre: dto.genre,
    aspectRatio: dto.aspectRatio,
    language: dto.language,
    durationSeconds: dto.durationSeconds,
    status: 'PENDING',
  },
})
```

**Retour immédiat:** `{ jobId: project.id, status: 'PENDING' }`

### 3️⃣ Backend - Pipeline Asynchrone

#### Étape A: Génération du Script avec Gemini
```typescript
// Appel à OpenRouter avec Gemini 2.0 Flash
const script = await this.callGemini(dto)

// Exemple de réponse:
{
  "title": "Hiroshima: The Day That Changed History",
  "hook": "August 6, 1945. A single bomb. 140,000 lives.",
  "scenes": [
    {
      "scene_number": 1,
      "narration": "In the summer of 1945, the world stood on the brink...",
      "duration_seconds": 10,
      "positive_prompt": "Aerial view of Hiroshima city 1945, peaceful morning, traditional Japanese architecture, wide cinematic shot, golden hour lighting, photorealistic 4K, smooth camera movement, detailed textures, historical accuracy",
      "negative_prompt": "blur, noise, glitch, cartoon, CGI, anime, deformed buildings, low-res, frozen motion, flicker, watermark, text overlay, overlit"
    },
    {
      "scene_number": 2,
      "narration": "The Enola Gay took off at 2:45 AM...",
      "duration_seconds": 10,
      "positive_prompt": "B-29 bomber aircraft in flight, dramatic sky, close-up shot, cinematic lighting, war documentary style, 4K quality, dynamic camera angle, metallic textures, historical realism",
      "negative_prompt": "blur, cartoon, CGI, deformed aircraft, low quality, static shot, jitter, watermark, overexposed"
    },
    {
      "scene_number": 3,
      "narration": "At 8:15 AM, everything changed forever...",
      "duration_seconds": 10,
      "positive_prompt": "Mushroom cloud rising over city, dramatic wide shot, cinematic apocalyptic lighting, documentary style, photorealistic 4K, slow motion effect, atmospheric detail, historical gravity",
      "negative_prompt": "blur, noise, cartoon, anime, low-res, frozen, flicker, text, watermark, overlit, unrealistic"
    }
  ],
  "loop_ending": "The story of Hiroshima reminds us...",
  "total_words": 130,
  "estimated_duration_seconds": 30
}
```

**Message WebSocket:** "Gemini développe votre idée en script cinématique..."  
**Progression:** 10% → 40%

**Logs Backend:**
```
[script-engine] Script generated: Hiroshima: The Day That Changed History (3 scenes, 130 words)
```

#### Étape B: Génération Vidéo avec LTX
```typescript
// Utilisation du prompt positif ET négatif de la première scène
const firstScene = script.scenes[0]

const response = await this.ltxService.generateClipWithRetry({
  prompt: firstScene.positive_prompt,
  negativePrompt: firstScene.negative_prompt,  // ✅ Ajouté!
  width: 768,
  height: 432,
  numFrames: 250,  // 10 secondes * 25 fps
  fps: 25,
})
```

**Message WebSocket:** "Script prêt: 'Hiroshima: The Day...' — génération de la première scène..."  
**Progression:** 40% → 100%

**Logs Backend:**
```
[script-engine] Generating video with LTX: 768x432, 250 frames
[script-engine] Positive prompt: Aerial view of Hiroshima city 1945, peaceful morning, traditional Japanese...
[script-engine] Negative prompt: blur, noise, glitch, cartoon, CGI, anime, deformed buildings, low-res...
```

### 4️⃣ Frontend - Polling du Statut
```typescript
// Poll toutes les 3 secondes
const status = await scriptEngine.getStatus(jobId)

// Mise à jour de la progression
if (status.status === 'GENERATING') {
  setProgress(60)
  setProgressMsg('LTX génère la vidéo avec les prompts AI...')
}

if (status.status === 'DONE') {
  setVideoUrl(status.videoJobId)
  setProgress(100)
  setProgressMsg('Your video is ready!')
}
```

### 5️⃣ Résultat Final
```typescript
// Base de données
{
  id: "clx...",
  userId: "user123",
  idea: "The mysterious story of the Hiroshima bomb",
  genre: "Documentary",
  aspectRatio: "16:9",
  language: "en-us",
  durationSeconds: 30,
  scriptJson: { /* script complet avec tous les prompts */ },
  status: "DONE",
  videoJobId: "https://vault-folk-delivery-illustration.trycloudflare.com/view/abc123.mp4"
}
```

**Frontend affiche:**
- ✅ Vidéo générée (lecteur vidéo)
- ✅ Bouton "Download Video"
- ✅ Bouton "Generate Another"

## 🎨 Prompts Générés par Gemini

### Structure du Prompt Positif (≤80 mots)
```
Subject · Action · Camera · Environment · Lighting · Style/Quality · Motion · Texture · Audio cue
```

**Exemple:**
```
Aerial view of Hiroshima city 1945, peaceful morning, traditional Japanese architecture, 
wide cinematic shot, golden hour lighting, photorealistic 4K, smooth camera movement, 
detailed textures, historical accuracy
```

### Structure du Prompt Négatif (≤40 mots)
```
Artifact · Style ban · Anatomy · Quality · Motion · Temporal · Text/UI · Lighting
```

**Exemple:**
```
blur, noise, glitch, cartoon, CGI, anime, deformed buildings, low-res, frozen motion, 
flicker, watermark, text overlay, overlit
```

## 📊 Messages de Progression

| Étape | Progression | Message Frontend | Message Backend |
|-------|-------------|------------------|-----------------|
| Début | 10% | "Gemini développe votre idée..." | "Gemini développe votre idée en script cinématique..." |
| Script prêt | 40% | "Gemini crée le script avec prompts LTX..." | "Script prêt: [titre] — génération de la première scène..." |
| Génération | 60% | "LTX génère la vidéo avec les prompts AI..." | "Generating video with LTX: [dimensions]" |
| Finalisation | 90% | "Finalisation..." | - |
| Terminé | 100% | "Your video is ready!" | "Your video is ready!" |

## ✅ Vérifications

### Backend
- ✅ Gemini génère le script complet via OpenRouter
- ✅ Script sauvegardé dans `scriptJson` avec tous les prompts
- ✅ Prompt positif ET négatif passés à LTX
- ✅ Logs détaillés pour debugging
- ✅ Messages WebSocket en temps réel

### Frontend
- ✅ Messages clairs sur le rôle de Gemini
- ✅ Progression visuelle (barre + pourcentage)
- ✅ Polling automatique du statut
- ✅ Affichage de la vidéo finale
- ✅ Options de téléchargement

## 🔧 Configuration Requise

```bash
# .env
GEMINI_API_KEY="sk-or-v1-..." # OpenRouter API key
LTX_SERVER_URL="https://vault-folk-delivery-illustration.trycloudflare.com"
```

## 🎯 Résumé

Quand l'utilisateur clique sur "Generate Video Directly":

1. **Gemini** (via OpenRouter) développe l'idée en script structuré
2. Le script contient des **prompts LTX optimisés** (positif + négatif)
3. **LTX 2.3** génère la vidéo avec ces prompts
4. L'utilisateur reçoit une **vidéo cinématique** basée sur son idée

**Tout est automatique et optimisé pour la qualité vidéo!** 🎬
