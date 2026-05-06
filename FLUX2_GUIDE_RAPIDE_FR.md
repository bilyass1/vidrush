# Guide Rapide - Génération d'Images Flux2

## 🎨 Vue d'ensemble

La fonctionnalité Flux2 permet de générer des images AI de haute qualité directement depuis la plateforme VidRush. Cette intégration utilise le modèle Flux2 via ComfyUI pour créer des images personnalisées basées sur vos descriptions textuelles.

## 🚀 Démarrage Rapide

### 1. Configuration Backend

Le module Flux2 est déjà intégré dans le backend. Assurez-vous que votre fichier `.env` contient:

```env
COMFYUI_URL=https://hammer-helmet-sue-hunter.trycloudflare.com
```

### 2. Utilisation dans la Page YouTube

Le composant `Flux2ImageGenerator` peut être ajouté à n'importe quelle page:

```typescript
import Flux2ImageGenerator from '@/components/youtube/Flux2ImageGenerator'

<Flux2ImageGenerator 
  onImageGenerated={(imageUrl) => {
    console.log('Image générée:', imageUrl)
    // Utilisez l'URL de l'image comme vous le souhaitez
  }}
/>
```

### 3. Génération d'une Image

1. **Entrez votre prompt** - Décrivez l'image que vous souhaitez générer
2. **Ajoutez une image de référence** (optionnel) - Pour guider la génération
3. **Configurez les paramètres:**
   - Mode Turbo: Activé (8 étapes, ~30-60s) ou Désactivé (20 étapes, ~2-3min)
   - Nombre d'étapes: Ajustez pour plus de qualité
4. **Cliquez sur "Generate Image"**
5. **Téléchargez ou utilisez** l'image générée

## 📋 Fonctionnalités Principales

### Mode Turbo ⚡
- **Activé (par défaut):** Génération rapide en 8 étapes (~30-60 secondes)
- **Désactivé:** Qualité supérieure en 20 étapes (~2-3 minutes)

### Image de Référence 🖼️
- Téléchargez une image pour guider la génération
- Formats supportés: PNG, JPG, JPEG, WEBP
- Taille maximale: 10MB

### Paramètres Personnalisables ⚙️
- **Résolution:** 1024x1024 pixels (par défaut)
- **Étapes:** 4-50 (8 recommandé en mode turbo)
- **Guidance:** Contrôle l'adhérence au prompt
- **Seed:** Pour des résultats reproductibles

## 🔌 API Endpoints

### Générer une Image
```http
POST /api/flux2/generate
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "prompt": "Une belle montagne au coucher du soleil",
  "referenceImage": <file>,
  "enableTurbo": true,
  "steps": 8,
  "width": 1024,
  "height": 1024,
  "guidance": 4
}
```

### Vérifier la Santé du Service
```http
POST /api/flux2/health
Authorization: Bearer <token>
```

## 💡 Exemples de Prompts

### Portrait Professionnel
```
A professional headshot of a business person, studio lighting, 
sharp focus, neutral background, corporate style
```

### Paysage Naturel
```
A serene mountain landscape at golden hour, misty valleys, 
dramatic clouds, photorealistic, 8k quality
```

### Art Conceptuel
```
Futuristic cyberpunk city at night, neon lights, 
flying cars, rain-soaked streets, cinematic composition
```

### Produit Commercial
```
Professional product photography of a smartphone, 
white background, studio lighting, reflections, high detail
```

## 🛠️ Intégration avec le Workflow Vidéo

L'image générée peut être utilisée comme:

1. **Miniature de vidéo** - Créez des thumbnails personnalisés
2. **Image de référence** - Pour la génération vidéo image-to-video
3. **Asset visuel** - Dans vos projets de montage
4. **Concept art** - Pour visualiser vos idées

### Exemple d'Intégration
```typescript
const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)

<Flux2ImageGenerator 
  onImageGenerated={(imageUrl) => {
    setThumbnailUrl(imageUrl)
    // L'image peut maintenant être utilisée comme thumbnail
  }}
/>

{thumbnailUrl && (
  <img src={thumbnailUrl} alt="Thumbnail" />
)}
```

## 🔧 Dépannage

### Le service ne répond pas
```bash
# Vérifiez la connexion ComfyUI
curl https://hammer-helmet-sue-hunter.trycloudflare.com/system_stats
```

### Génération lente
- ✅ Activez le mode Turbo
- ✅ Réduisez le nombre d'étapes
- ✅ Vérifiez la stabilité du tunnel Cloudflare

### Erreur de téléchargement
- ✅ Vérifiez que l'image fait moins de 10MB
- ✅ Utilisez un format supporté (PNG, JPG, WEBP)
- ✅ Assurez-vous que le dossier `uploads/flux2-references` existe

### Modèles manquants
Vérifiez que ComfyUI a ces modèles installés:
- `flux2_dev_fp8mixed.safetensors`
- `mistral_3_small_flux2_bf16.safetensors`
- `full_encoder_small_decoder.safetensors`
- `Flux_2-Turbo-LoRA_comfyui.safetensors`

## 📊 Performance

| Mode | Temps | Qualité | Utilisation |
|------|-------|---------|-------------|
| Turbo | 30-60s | Bonne | Prototypage rapide |
| Normal | 2-3min | Excellente | Production finale |

## 🔐 Sécurité

- ✅ Authentification JWT requise
- ✅ Validation des types de fichiers
- ✅ Limite de taille de fichier (10MB)
- ✅ Protection contre les injections de chemin

## 📚 Ressources Additionnelles

- [Documentation Complète](./FLUX2_IMAGE_GENERATION.md)
- [Architecture Système](./ARCHITECTURE.md)
- [Intégration ComfyUI](./COMFYUI_INTEGRATION_CHANGES.md)

## 🎯 Cas d'Usage

### E-commerce
Générez des images de produits professionnelles pour vos vidéos de présentation.

### Marketing
Créez des visuels accrocheurs pour vos campagnes vidéo.

### Éducation
Illustrez vos contenus éducatifs avec des images personnalisées.

### Divertissement
Produisez des concepts visuels pour vos vidéos créatives.

## 🚀 Prochaines Étapes

1. **Testez le composant** dans votre page YouTube
2. **Expérimentez avec différents prompts** pour voir les possibilités
3. **Intégrez les images générées** dans votre workflow vidéo
4. **Partagez vos créations** avec la communauté

## 💬 Support

Pour toute question ou problème:
1. Consultez la [documentation complète](./FLUX2_IMAGE_GENERATION.md)
2. Vérifiez les logs du backend pour les erreurs
3. Testez la connexion ComfyUI avec l'endpoint `/flux2/health`

---

**Note:** Cette fonctionnalité nécessite un serveur ComfyUI actif avec les modèles Flux2 installés.
