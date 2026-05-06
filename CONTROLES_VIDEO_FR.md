# Contrôles de Qualité, FPS et Durée - Guide Utilisateur

## 📍 Où se trouvent les contrôles?

Les contrôles de qualité vidéo se trouvent dans la page **Script Engine** :

```
Dashboard → Script Engine → Step 6: Quality & FPS
```

## 🎛️ Contrôles Disponibles

### 1. **Qualité Vidéo** (Step 6)

Trois presets de qualité sont disponibles:

| Preset | Résolution | FPS | Temps de génération | Utilisation |
|--------|------------|-----|---------------------|-------------|
| ⚡ **Low (360p)** | 640x360 | 15 | ~1-2 min | Aperçu rapide |
| ⭐ **Medium (720p)** | 1280x720 | 25 | ~3-5 min | Réseaux sociaux (recommandé) |
| 🎬 **High (1080p)** | 1920x1080 | 30 | ~8-12 min | Professionnel |

### 2. **FPS Personnalisé** (Step 6)

Un slider permet de choisir le FPS entre 15 et 30:
- **15 FPS**: Génération rapide, mouvement basique
- **20 FPS**: Équilibré
- **25 FPS**: Standard vidéo (recommandé)
- **30 FPS**: Mouvement très fluide

### 3. **Durée** (Step 5)

Un slider permet de choisir la durée entre 8 secondes et 40 minutes:
- **8s - 30s**: Clips courts (TikTok, Reels)
- **1min - 5min**: Vidéos moyennes (YouTube Shorts)
- **5min+**: Vidéos longues (YouTube)

**⚠️ Contrainte**: La durée est automatiquement limitée à **10 secondes maximum** pour la génération vidéo.

## 🔒 Contraintes Automatiques

Le système applique automatiquement ces limites:

```typescript
MAX_DURATION: 10 secondes
MAX_RESOLUTION: 1080p (1920x1080)
MAX_FPS: 30 fps
```

Si vous demandez des valeurs supérieures, elles seront automatiquement réduites aux maximums.

## 📱 Interface Utilisateur

### Étape 6: Quality & FPS

```
┌─────────────────────────────────────────────────┐
│ 6  Quality & FPS                                │
│    Choose video quality (max 1080p, 30fps, 10s) │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ ⚡        │  │ ⭐        │  │ 🎬        │      │
│  │ Low      │  │ Medium   │  │ High     │      │
│  │ (360p)   │  │ (720p)   │  │ (1080p)  │      │
│  │ 15 FPS   │  │ 25 FPS   │  │ 30 FPS   │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  Custom FPS (Optional)                          │
│  ├────────────────────────────┤ 25 FPS          │
│  15    20    25    30                           │
│                                                  │
│  ℹ️ Constraints automatiques:                   │
│  • Durée max: 10 secondes                       │
│  • Résolution max: 1080p                        │
│  • FPS max: 30 fps                              │
└─────────────────────────────────────────────────┘
```

## 🎯 Exemples d'Utilisation

### Pour TikTok / Instagram Reels
```
Aspect Ratio: 9:16 (vertical)
Quality: Medium (720p)
FPS: 25
Duration: 5-7 secondes
```

### Pour YouTube
```
Aspect Ratio: 16:9 (landscape)
Quality: High (1080p)
FPS: 30
Duration: 8-10 secondes
```

### Pour Aperçu Rapide
```
Aspect Ratio: 16:9
Quality: Low (360p)
FPS: 15
Duration: 3 secondes
```

## 🔧 Comment Utiliser

1. **Ouvrez la page Script Engine**
   ```
   http://localhost:3000/dashboard/script-engine
   ```

2. **Remplissez les étapes 1-5** (Idée, Genre, Aspect Ratio, Language, Duration)

3. **Choisissez votre qualité** (Step 6)
   - Cliquez sur un preset (Low, Medium, High)
   - Ou ajustez le FPS manuellement avec le slider

4. **Générez votre vidéo**
   - Cliquez sur "Generate Video Directly"

## 📊 Temps de Génération Estimés

| Qualité | Durée | FPS | Temps Estimé |
|---------|-------|-----|--------------|
| 360p | 3s | 15 | ~1-2 min |
| 720p | 5s | 25 | ~3-5 min |
| 1080p | 10s | 30 | ~8-12 min |

*Les temps varient selon la charge du serveur*

## 💡 Conseils

### Pour une génération rapide:
- Utilisez **Low (360p)** ou **Medium (720p)**
- Réduisez la durée à **3-5 secondes**
- Utilisez **15-20 FPS**

### Pour la meilleure qualité:
- Utilisez **High (1080p)**
- Utilisez **30 FPS**
- Fournissez un prompt détaillé
- Utilisez une image de référence si disponible

### Pour les réseaux sociaux:
- **Medium (720p)** est le meilleur compromis
- **25 FPS** est suffisant
- **5-7 secondes** est la durée idéale

## 🐛 Dépannage

### La génération prend trop de temps
**Solution**: Réduisez la qualité à Medium ou Low, réduisez le FPS à 20-25

### La qualité n'est pas assez bonne
**Solution**: Augmentez à High (1080p) et 30 FPS

### La vidéo est trop courte
**Solution**: La durée max est 10 secondes pour l'instant. Pour des vidéos plus longues, générez plusieurs clips.

### Les paramètres ne sont pas appliqués
**Solution**: Vérifiez les logs du backend pour voir les valeurs contraintes appliquées

## 📝 Notes Techniques

Les contrôles sont implémentés dans:
- **Frontend**: `apps/web/src/app/dashboard/script-engine/page.tsx`
- **Backend**: `apps/backend/src/video-generation/services/ltx.service.ts`
- **Configuration**: `apps/backend/src/video-generation/config/video-constraints.config.ts`

Les valeurs sont automatiquement validées et contraintes côté backend pour garantir la stabilité du système.

## 🚀 Prochaines Améliorations

- [ ] Durée max augmentée à 30 secondes
- [ ] Support de résolutions personnalisées
- [ ] Estimation du temps de génération en temps réel
- [ ] Aperçu de la qualité avant génération
- [ ] File d'attente pour plusieurs vidéos

---

**Dernière mise à jour**: 2026-05-06
**Version**: 1.0.0
