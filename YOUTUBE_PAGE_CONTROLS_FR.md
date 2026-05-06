# 🎬 Contrôles Vidéo - Page YouTube Generator

## ✅ Implémentation Complète

Les contrôles de **qualité, FPS et durée** sont maintenant disponibles dans la page YouTube Generator!

### 📍 Localisation

```
URL: http://localhost:3000/dashboard/youtube
Navigation: Dashboard → YouTube Generator
```

### 🎛️ Contrôles Disponibles

#### Step 5: Duration (Durée)
- **Slider**: 8 secondes à 27 minutes
- **Contrainte**: Maximum 10 secondes pour la génération vidéo
- **Presets rapides**: 8s, 60s, 5min, 10min, 20min, 27min

#### Step 6: Quality & FPS ⭐ NOUVEAU
- **3 Presets de qualité**:
  - ⚡ **Low (360p)**: 640x360, 15 FPS, ~1-2 min
  - ⭐ **Medium (720p)**: 1280x720, 25 FPS, ~3-5 min (recommandé)
  - 🎬 **High (1080p)**: 1920x1080, 30 FPS, ~8-12 min

- **Slider FPS personnalisé**:
  - Plage: 15-30 FPS
  - Presets: 15, 20, 25, 30
  - Option de reset

- **Bannière d'information**:
  - Durée max: 10 secondes
  - Résolution max: 1080p
  - FPS max: 30 fps

## 🎨 Interface Visuelle

```
┌────────────────────────────────────────────────────────────────┐
│  6  Quality & FPS                                              │
│     Choose video quality (max 1080p, 30fps, 10s)               │
├────────────────────────────────────────────────────────────────┤
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
```

## 🚀 Guide d'Utilisation

### Étape par Étape

1. **Ouvrir la page YouTube Generator**
   ```
   http://localhost:3000/dashboard/youtube
   ```

2. **Remplir les informations de base** (Steps 1-4)
   - **Step 1**: Décrire votre idée (min 3 caractères)
   - **Step 2**: Choisir le genre (Documentary, True Crime, etc.)
   - **Step 3**: Sélectionner l'aspect ratio (16:9, 9:16, 1:1, 4:5)
   - **Step 4**: Choisir la langue du script

3. **Configurer la durée** (Step 5)
   - Déplacer le slider ou cliquer sur un preset
   - Note: Max 10s pour la génération vidéo

4. **Choisir la qualité** (Step 6) ⭐ NOUVEAU
   - Cliquer sur un preset (Low, Medium, High)
   - Optionnel: Ajuster le FPS avec le slider
   - Voir les contraintes dans la bannière bleue

5. **Optionnel: Ajouter une image de référence** (Step 1)
   - Upload une image pour guider la génération

6. **Optionnel: Tester une voix** (Step 7)
   - Sélectionner une voix pour le TTS

7. **Générer la vidéo**
   - Cliquer sur "Generate Video Directly"
   - Attendre 1-12 minutes selon la qualité

## 📊 Recommandations par Plateforme

### 🎵 TikTok / Instagram Reels
```
Aspect Ratio: 9:16 (vertical)
Quality: Medium (720p)
FPS: 25
Duration: 5-7 secondes
```

### 📺 YouTube
```
Aspect Ratio: 16:9 (landscape)
Quality: High (1080p)
FPS: 30
Duration: 8-10 secondes
```

### 📸 Instagram Feed
```
Aspect Ratio: 1:1 (square)
Quality: Medium (720p)
FPS: 25
Duration: 5 secondes
```

### ⚡ Aperçu Rapide
```
Aspect Ratio: 16:9
Quality: Low (360p)
FPS: 15
Duration: 3 secondes
```

## 🔧 Détails Techniques

### Variables d'État
```typescript
const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')
const [customFps, setCustomFps] = useState<number | null>(null)
```

### Presets de Qualité
```typescript
const QUALITY_PRESETS = [
  { id: 'low', label: 'Low (360p)', width: 640, height: 360, fps: 15, ... },
  { id: 'medium', label: 'Medium (720p)', width: 1280, height: 720, fps: 25, ... },
  { id: 'high', label: 'High (1080p)', width: 1920, height: 1080, fps: 30, ... },
]
```

### Fichier Source
```
apps/web/src/app/dashboard/youtube/page.tsx
```

## 🎯 Fonctionnalités

### ✅ Implémenté
- [x] 3 presets de qualité (Low, Medium, High)
- [x] Slider FPS personnalisé (15-30)
- [x] Presets FPS rapides (15, 20, 25, 30)
- [x] Bannière d'information des contraintes
- [x] Reset du FPS au preset
- [x] Design responsive
- [x] Animations et transitions
- [x] Validation automatique côté backend

### 🔄 Intégration Backend
Les valeurs sont automatiquement envoyées au backend qui applique les contraintes:
- Durée max: 10 secondes
- Résolution max: 1080p
- FPS max: 30 fps

## 💡 Conseils d'Utilisation

### Pour une génération rapide
- Utilisez **Low (360p)** ou **Medium (720p)**
- Réduisez la durée à **3-5 secondes**
- Utilisez **15-20 FPS**
- Temps estimé: **1-3 minutes**

### Pour la meilleure qualité
- Utilisez **High (1080p)**
- Utilisez **30 FPS**
- Durée: **8-10 secondes**
- Fournissez un prompt détaillé
- Temps estimé: **8-12 minutes**

### Pour les réseaux sociaux (recommandé)
- Utilisez **Medium (720p)** ⭐
- Utilisez **25 FPS**
- Durée: **5-7 secondes**
- Temps estimé: **3-5 minutes**

## 🎨 Style et Design

### Couleurs
- **Preset sélectionné**: Vert émeraude (`emerald-600/10`, `emerald-500`)
- **Preset non sélectionné**: Noir zinc (`zinc-950`, `zinc-800`)
- **Slider FPS**: Accent vert émeraude (`accent-emerald-500`)
- **Bannière info**: Bleu (`blue-500/10`, `blue-500/20`)

### Icônes
- **Low**: ⚡ (éclair)
- **Medium**: ⭐ (étoile)
- **High**: 🎬 (clap de cinéma)
- **Info**: AlertCircle (lucide-react)

### Animations
- Hover: `hover:border-zinc-700`, `hover:text-zinc-400`
- Transitions: `transition-all`, `transition-colors`
- Groupes: `group`, `group-hover:text-zinc-200`

## 📱 Responsive Design

### Desktop (≥ 768px)
- Presets: 3 colonnes
- Slider FPS: Pleine largeur
- Bannière: Pleine largeur

### Mobile (< 768px)
- Presets: 1 colonne (empilés)
- Slider FPS: Pleine largeur
- Bannière: Pleine largeur

## 🧪 Tests

### Test Manuel
1. Ouvrir `http://localhost:3000/dashboard/youtube`
2. Remplir les steps 1-5
3. Cliquer sur "Medium (720p)" dans Step 6
4. Vérifier: Bordure verte, badge "25 FPS"
5. Déplacer le slider FPS
6. Vérifier: Valeur mise à jour
7. Cliquer "Reset to preset FPS"
8. Vérifier: Retour à 25 FPS
9. Générer une vidéo
10. Vérifier dans les logs backend: Contraintes appliquées

## 📚 Documentation Associée

- [REPONSE_RAPIDE_FR.md](./REPONSE_RAPIDE_FR.md) - Réponse rapide
- [LOCALISATION_CONTROLES.md](./LOCALISATION_CONTROLES.md) - Localisation détaillée
- [CONTROLES_VIDEO_FR.md](./CONTROLES_VIDEO_FR.md) - Guide utilisateur complet
- [VIDEO_CONSTRAINTS_GUIDE.md](./VIDEO_CONSTRAINTS_GUIDE.md) - Guide technique
- [VIDEO_CONTROLS_UPDATE.md](./VIDEO_CONTROLS_UPDATE.md) - Résumé des changements

## 🎉 Résumé

Les contrôles de qualité, FPS et durée sont maintenant **entièrement fonctionnels** dans la page YouTube Generator (`/dashboard/youtube`)!

**Fonctionnalités clés**:
- ✅ 3 presets de qualité
- ✅ FPS personnalisable (15-30)
- ✅ Contraintes automatiques
- ✅ Interface intuitive
- ✅ Design responsive
- ✅ Intégration backend complète

**Prêt à utiliser!** 🚀

---

**Créé le**: 2026-05-06
**Par**: Kiro AI Assistant
**Page**: `/dashboard/youtube`
