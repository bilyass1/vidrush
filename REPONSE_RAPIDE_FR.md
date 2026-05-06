# ❓ Où est le contrôle de qualité et FPS et durée?

## ✅ Réponse Rapide

Les contrôles se trouvent dans la page **YouTube Generator**, étapes 5 et 6:

```
📍 URL: http://localhost:3000/dashboard/youtube

Step 5: Duration (Durée)          → Slider de 8s à 40min (max 10s pour vidéo)
Step 6: Quality & FPS (Qualité)   → 3 presets + slider FPS personnalisé
```

## 🎛️ Contrôles Disponibles

### 1. Durée (Step 5)
```
├──────────●─────────────────────────────────────┤  5s
2s    3s    5s    7s    10s
```
**Contrainte**: Maximum 10 secondes pour la génération vidéo

### 2. Qualité (Step 6)
```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ ⚡        │  │ ⭐        │  │ 🎬        │
│ Low      │  │ Medium   │  │ High     │
│ 360p     │  │ 720p     │  │ 1080p    │
│ 15 FPS   │  │ 25 FPS   │  │ 30 FPS   │
│ ~1-2 min │  │ ~3-5 min │  │ ~8-12min │
└──────────┘  └──────────┘  └──────────┘
```

### 3. FPS Personnalisé (Step 6)
```
Custom FPS (Optional)
├──────────●─────────────────────────────┤  25 FPS
15         20         25         30
```

## 📊 Tableau Récapitulatif

| Paramètre | Minimum | Maximum | Défaut | Localisation |
|-----------|---------|---------|--------|--------------|
| **Durée** | 2s | 10s | 5s | Step 5 |
| **Résolution** | 360p | 1080p | 720p | Step 6 |
| **FPS** | 15 | 30 | 25 | Step 6 |

## 🚀 Comment Utiliser

1. **Ouvrir la page**
   ```
   Dashboard → YouTube Generator
   ```

2. **Remplir les étapes 1-4**
   - Idée
   - Genre
   - Aspect Ratio
   - Language

3. **Choisir la durée** (Step 5)
   - Déplacer le slider (2-10 secondes)
   - Ou cliquer sur un preset (2s, 3s, 5s, 7s, 10s)

4. **Choisir la qualité** (Step 6)
   - Cliquer sur Low, Medium ou High
   - Optionnel: Ajuster le FPS avec le slider

5. **Générer**
   - Cliquer sur "Generate Video Directly"

## 💡 Recommandations

### Pour TikTok/Reels
- **Durée**: 5-7s
- **Qualité**: Medium (720p)
- **FPS**: 25
- **Aspect Ratio**: 9:16

### Pour YouTube
- **Durée**: 8-10s
- **Qualité**: High (1080p)
- **FPS**: 30
- **Aspect Ratio**: 16:9

### Pour Aperçu Rapide
- **Durée**: 3s
- **Qualité**: Low (360p)
- **FPS**: 15
- **Aspect Ratio**: 16:9

## 🔒 Contraintes Automatiques

Le système applique ces limites automatiquement:

```typescript
✅ Durée max: 10 secondes
✅ Résolution max: 1080p (1920x1080)
✅ FPS max: 30 fps
```

Si vous demandez plus, les valeurs seront réduites automatiquement.

## 📸 Capture d'Écran de l'Interface

```
┌─────────────────────────────────────────────────┐
│ 6  Quality & FPS                                │
│    Choose video quality (max 1080p, 30fps, 10s) │
├─────────────────────────────────────────────────┤
│                                                  │
│  ⚡ Low (360p)     ⭐ Medium (720p)  🎬 High     │
│  15 FPS           25 FPS            30 FPS      │
│  Fast preview     Social media      Professional│
│  ~1-2 min         ~3-5 min          ~8-12 min   │
│  640x360          1280x720          1920x1080   │
│                                                  │
│  Custom FPS (Optional)              Max 30 FPS  │
│  ├────────────────────────────┤ 25 FPS          │
│  15    20    25    30                           │
│                                                  │
│  ℹ️ Constraints automatiques:                   │
│  • Durée max: 10 secondes                       │
│  • Résolution max: 1080p                        │
│  • FPS max: 30 fps                              │
└─────────────────────────────────────────────────┘
```

## 📚 Documentation Complète

Pour plus de détails, consultez:

- **[LOCALISATION_CONTROLES.md](./LOCALISATION_CONTROLES.md)** - Localisation exacte avec diagrammes
- **[CONTROLES_VIDEO_FR.md](./CONTROLES_VIDEO_FR.md)** - Guide utilisateur complet
- **[VIDEO_CONSTRAINTS_GUIDE.md](./VIDEO_CONSTRAINTS_GUIDE.md)** - Guide technique développeurs

## ❓ Questions Fréquentes

### Q: Pourquoi la durée est limitée à 10 secondes?
**R**: Pour garantir des temps de génération raisonnables et éviter la surcharge du serveur.

### Q: Puis-je générer une vidéo plus longue?
**R**: Actuellement non, mais vous pouvez générer plusieurs clips de 10s et les assembler.

### Q: Quelle qualité choisir?
**R**: Medium (720p) est le meilleur compromis qualité/vitesse pour les réseaux sociaux.

### Q: Le FPS personnalisé est-il nécessaire?
**R**: Non, les presets ont déjà des FPS optimaux. Utilisez-le seulement si vous avez des besoins spécifiques.

### Q: Combien de temps prend la génération?
**R**: 
- Low (360p): ~1-2 minutes
- Medium (720p): ~3-5 minutes
- High (1080p): ~8-12 minutes

---

**Réponse créée le**: 2026-05-06
**Par**: Kiro AI Assistant
