# User Video Generation Controls

## Quick Reference

You can now control video quality, duration, and frame rate with the following constraints:

### ✅ Allowed Ranges

| Parameter | Minimum | Maximum | Default |
|-----------|---------|---------|---------|
| **Duration** | 1 second | **10 seconds** | 5 seconds |
| **Quality (Resolution)** | 360p | **1080p** | 720p |
| **FPS (Frame Rate)** | 15 fps | **30 fps** | 25 fps |

## How to Use

### 1. Choose Your Aspect Ratio

Select from these presets:

- **16:9** (1920x1080) - YouTube, landscape videos
- **9:16** (608x1080) - TikTok, Instagram Stories, vertical videos
- **1:1** (1024x1024) - Instagram feed, square videos
- **4:5** (864x1080) - Instagram feed, portrait videos

### 2. Set Duration

Choose between 1-10 seconds:
- **Short clips (1-3s)**: Quick animations, logos
- **Medium clips (4-7s)**: Product showcases, transitions
- **Long clips (8-10s)**: Full scenes, storytelling

### 3. Select Quality

Three quality levels available:

#### 🔵 Low Quality (360p)
- Resolution: 640x360
- FPS: 15
- ⚡ Fastest generation (~1-2 min)
- 💾 Smallest file size
- 📱 Good for previews

#### 🟢 Medium Quality (720p) - **Recommended**
- Resolution: 1280x720
- FPS: 25
- ⚡ Balanced speed (~2-4 min)
- 💾 Moderate file size
- 📱 Good for social media

#### 🔴 High Quality (1080p)
- Resolution: 1920x1080
- FPS: 30
- ⚡ Slower generation (~5-12 min)
- 💾 Larger file size
- 📱 Best for professional use

## API Examples

### Example 1: Quick Preview (Fast)
```json
{
  "prompt": "A sunset over mountains",
  "width": 640,
  "height": 360,
  "fps": 15,
  "duration": 3
}
```
**Generation time**: ~1-2 minutes

### Example 2: Social Media Post (Balanced)
```json
{
  "prompt": "Product showcase with smooth camera movement",
  "width": 1280,
  "height": 720,
  "fps": 25,
  "duration": 5
}
```
**Generation time**: ~3-5 minutes

### Example 3: Professional Video (Best Quality)
```json
{
  "prompt": "Cinematic scene with detailed textures",
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "duration": 10
}
```
**Generation time**: ~8-12 minutes

## Tips for Best Results

### 🎯 For Faster Generation
- Use 720p or lower resolution
- Keep duration under 5 seconds
- Use 25 fps or lower

### 🎨 For Better Quality
- Use 1080p resolution
- Use 30 fps for smooth motion
- Provide detailed prompts
- Use reference images when available

### 💡 General Tips
1. **Start with medium quality** to test your prompt
2. **Increase quality** once you're happy with the result
3. **Longer videos** take exponentially more time
4. **Higher FPS** makes motion smoother but takes longer

## Automatic Constraints

The system automatically enforces these limits:

- If you request **more than 10 seconds**, it will be capped at 10 seconds
- If you request **more than 1080p**, it will be capped at 1080p
- If you request **more than 30 fps**, it will be capped at 30 fps

### Example of Auto-Constraint

```json
// You request:
{
  "duration": 15,    // Too long
  "width": 2560,     // Too wide
  "height": 1440,    // Too tall
  "fps": 60          // Too fast
}

// System automatically adjusts to:
{
  "duration": 10,    // ✅ Capped at max
  "width": 1920,     // ✅ Capped at max
  "height": 1080,    // ✅ Capped at max
  "fps": 30          // ✅ Capped at max
}
```

## Recommended Settings by Use Case

### 📱 TikTok / Instagram Reels
```json
{
  "aspectRatio": "9:16",
  "width": 608,
  "height": 1080,
  "fps": 30,
  "duration": 5-7
}
```

### 🎬 YouTube Videos
```json
{
  "aspectRatio": "16:9",
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "duration": 8-10
}
```

### 📸 Instagram Feed
```json
{
  "aspectRatio": "1:1",
  "width": 1024,
  "height": 1024,
  "fps": 25,
  "duration": 5
}
```

### 🖼️ Product Showcase
```json
{
  "aspectRatio": "16:9",
  "width": 1280,
  "height": 720,
  "fps": 25,
  "duration": 5
}
```

## Cost vs Quality Trade-offs

| Setting | Generation Time | Quality | File Size | Best For |
|---------|----------------|---------|-----------|----------|
| 360p, 15fps, 3s | ⚡ Very Fast | ⭐⭐ | 💾 Small | Previews, testing |
| 720p, 25fps, 5s | ⚡⚡ Fast | ⭐⭐⭐ | 💾💾 Medium | Social media |
| 1080p, 30fps, 10s | ⚡⚡⚡ Slow | ⭐⭐⭐⭐⭐ | 💾💾💾 Large | Professional |

## Need Help?

- **Generation too slow?** → Reduce resolution or duration
- **Quality not good enough?** → Increase resolution and FPS
- **Video too short?** → Increase duration (max 10s)
- **File too large?** → Reduce resolution or FPS

## Technical Details

For developers and advanced users, see:
- [VIDEO_CONSTRAINTS_GUIDE.md](./VIDEO_CONSTRAINTS_GUIDE.md) - Technical implementation details
- [apps/backend/src/video-generation/config/video-constraints.config.ts](./apps/backend/src/video-generation/config/video-constraints.config.ts) - Configuration file
