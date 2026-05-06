# 📍 Localisation des Contrôles Vidéo

## 📍 Où se trouvent les contrôles?

### Page: YouTube Generator (`/dashboard/youtube`)

```
┌────────────────────────────────────────────────────────────────┐
│  🎬 Craft Your Script                                          │
│  AI Script Engine — Gemini Powered                             │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  1️⃣  Describe Your Idea                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Ex: The mysterious story of the Hiroshima bomb...       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  2️⃣  Video Genre                                               │
│  [Documentary] [Dark History] [True Crime] [Educational]...    │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  3️⃣  Aspect Ratio                                              │
│  [16:9 Landscape] [9:16 Vertical] [1:1 Square]                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  4️⃣  Script Language                                           │
│  [🇺🇸 US English] [🇬🇧 UK English] [🇫🇷 French] [🇸🇦 Arabic]    │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  5️⃣  Duration                                    60s           │
│  ├──────────────●─────────────────────────────────────────┤    │
│  8s    60s    5min    10min    20min    40min                  │
│                                                                 │
│  ⚠️  Contrainte: Max 10 secondes pour la génération vidéo      │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  6️⃣  Quality & FPS                    ⭐ NOUVEAUX CONTRÔLES    │
│  Choose video quality (max 1080p, 30fps, 10s)                  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ ⚡ 15 FPS     │  │ ⭐ 25 FPS     │  │ 🎬 30 FPS     │         │
│  │              │  │              │  │              │         │
│  │ Low (360p)   │  │ Medium (720p)│  │ High (1080p) │         │
│  │              │  │              │  │              │         │
│  │ Fast preview │  │ Social media │  │ Professional │         │
│  │ ~1-2 min     │  │ ~3-5 min     │  │ ~8-12 min    │         │
│  │              │  │              │  │              │         │
│  │ 640x360      │  │ 1280x720     │  │ 1920x1080    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  Custom FPS (Optional)                          Max 30 FPS     │
│  ├──────────────●─────────────────────────────────┤  25 FPS    │
│  15         20         25         30                           │
│                                                                 │
│  ℹ️  Constraints automatiques:                                 │
│  • Durée max: 10 secondes                                      │
│  • Résolution max: 1080p (1920x1080)                           │
│  • FPS max: 30 fps                                             │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  7️⃣  Voice Model (Optional)                                    │
│  Pick a voice for future TTS generation                        │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  [✨ Generate Video Directly]                                  │
│  Gemini développe l'idée → génère vidéo (30s max)              │
└────────────────────────────────────────────────────────────────┘
```

## 🎯 Accès Rapide

### URL Directe
```
http://localhost:3000/dashboard/youtube
```

### Navigation
```
Dashboard → YouTube Generator → Scroll to Step 6
```

## 📋 Résumé des Contrôles

| Contrôle | Localisation | Valeurs | Contrainte |
|----------|--------------|---------|------------|
| **Durée** | Step 5 | 8s - 2400s | Max 10s pour vidéo |
| **Qualité** | Step 6 | 360p / 720p / 1080p | Max 1080p |
| **FPS** | Step 6 | 15 - 30 fps | Max 30 fps |

## 🔍 Détails des Contrôles

### Step 5: Duration (Durée)
- **Type**: Slider horizontal
- **Plage**: 8 secondes à 40 minutes
- **Valeur par défaut**: 60 secondes
- **Contrainte appliquée**: Maximum 10 secondes pour la génération vidéo
- **Affichage**: Format lisible (ex: "60s", "5min", "20min")

### Step 6: Quality & FPS (Qualité et Images par Seconde)

#### Presets de Qualité
- **Type**: 3 boutons de sélection
- **Options**:
  1. **Low (360p)**: 640x360, 15 FPS, ~1-2 min
  2. **Medium (720p)**: 1280x720, 25 FPS, ~3-5 min ⭐ Recommandé
  3. **High (1080p)**: 1920x1080, 30 FPS, ~8-12 min

#### FPS Personnalisé
- **Type**: Slider horizontal + boutons rapides
- **Plage**: 15 à 30 FPS
- **Valeurs rapides**: 15, 20, 25, 30
- **Valeur par défaut**: Selon le preset sélectionné
- **Option**: Bouton "Reset to preset FPS" pour revenir au preset

#### Bannière d'Information
- **Type**: Alerte informative bleue
- **Contenu**: Liste des contraintes automatiques
- **Icône**: ℹ️ AlertCircle

## 💻 Code Source

### Fichier Principal
```
apps/web/src/app/dashboard/youtube/page.tsx
```

### Lignes Importantes
- **Ligne ~100**: Définition des `QUALITY_PRESETS`
- **Ligne ~130**: État `quality` et `customFps`
- **Ligne ~760**: Rendu de la section "Step 6: Quality & FPS"

### Variables d'État
```typescript
const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')
const [customFps, setCustomFps] = useState<number | null>(null)
```

## 🎨 Style Visuel

### Couleurs
- **Preset sélectionné**: Fond vert émeraude (`emerald-600/20`), bordure verte
- **Preset non sélectionné**: Fond noir zinc (`zinc-950`), bordure blanche/10
- **Slider FPS**: Accent vert émeraude (`accent-emerald-500`)
- **Bannière info**: Fond bleu (`blue-500/10`), bordure bleue

### Icônes
- **Low**: ⚡ (éclair)
- **Medium**: ⭐ (étoile)
- **High**: 🎬 (clap de cinéma)
- **Info**: ℹ️ (AlertCircle de lucide-react)

## 🔄 Flux de Données

```
User sélectionne qualité
    ↓
État `quality` mis à jour
    ↓
Preset appliqué (width, height, fps)
    ↓
User ajuste FPS (optionnel)
    ↓
État `customFps` mis à jour
    ↓
Valeurs envoyées au backend
    ↓
Backend applique contraintes
    ↓
Génération vidéo avec paramètres validés
```

## 📱 Responsive Design

### Desktop (> 768px)
- Presets de qualité: 3 colonnes
- Slider FPS: Pleine largeur
- Bannière info: Pleine largeur

### Mobile (< 768px)
- Presets de qualité: 1 colonne (empilés)
- Slider FPS: Pleine largeur
- Bannière info: Pleine largeur

## 🧪 Test des Contrôles

### Test 1: Sélection de Preset
1. Ouvrir `/dashboard/youtube`
2. Scroller jusqu'à Step 6
3. Cliquer sur "Medium (720p)"
4. Vérifier: Bordure verte, FPS = 25

### Test 2: FPS Personnalisé
1. Sélectionner un preset
2. Déplacer le slider FPS
3. Vérifier: Valeur FPS mise à jour
4. Cliquer "Reset to preset FPS"
5. Vérifier: Retour au FPS du preset

### Test 3: Génération Vidéo
1. Remplir tous les champs
2. Sélectionner "High (1080p)"
3. Cliquer "Generate Video Directly"
4. Vérifier dans les logs backend: Contraintes appliquées

## 📚 Documentation Associée

- [CONTROLES_VIDEO_FR.md](./CONTROLES_VIDEO_FR.md) - Guide utilisateur complet
- [VIDEO_CONSTRAINTS_GUIDE.md](./VIDEO_CONSTRAINTS_GUIDE.md) - Guide technique
- [USER_VIDEO_CONTROLS.md](./USER_VIDEO_CONTROLS.md) - Guide utilisateur anglais
- [VIDEO_CONTROLS_UPDATE.md](./VIDEO_CONTROLS_UPDATE.md) - Résumé des changements

---

**Dernière mise à jour**: 2026-05-06
**Créé par**: Kiro AI Assistant
