# Quick Start: Video Generation Controls

## TL;DR

Users can now control video quality, duration, and FPS with automatic constraints:
- **Max Duration**: 10 seconds
- **Max Quality**: 1080p (1920x1080)
- **Max FPS**: 30 fps

## For Users

### Choose Your Settings

```typescript
// Fast preview (1-2 min)
{ width: 640, height: 360, fps: 15, duration: 3 }

// Social media (3-5 min) ⭐ RECOMMENDED
{ width: 1280, height: 720, fps: 25, duration: 5 }

// Professional (8-12 min)
{ width: 1920, height: 1080, fps: 30, duration: 10 }
```

## For Developers

### 1. Import the Config

```typescript
import { VIDEO_CONSTRAINTS, constrainVideoParams } from '../config/video-constraints.config';
```

### 2. Apply Constraints

```typescript
const constrained = constrainVideoParams({
  width: userInput.width,
  height: userInput.height,
  fps: userInput.fps,
  duration: userInput.duration
});
```

### 3. Use in LTX Service

```typescript
const response = await ltxService.generateClipWithRetry({
  prompt: "Your prompt here",
  width: constrained.width,
  height: constrained.height,
  fps: constrained.fps,
  duration: constrained.duration
});
```

## Configuration Location

Edit constraints here:
```
apps/backend/src/video-generation/config/video-constraints.config.ts
```

## Files Changed

1. ✅ `ltx.service.ts` - Added constraint enforcement
2. ✅ `direct-video.service.ts` - Updated to use HD presets
3. ✅ `video-constraints.config.ts` - New centralized config

## Documentation

- **Users**: Read [USER_VIDEO_CONTROLS.md](./USER_VIDEO_CONTROLS.md)
- **Developers**: Read [VIDEO_CONSTRAINTS_GUIDE.md](./VIDEO_CONSTRAINTS_GUIDE.md)
- **Summary**: Read [VIDEO_CONTROLS_UPDATE.md](./VIDEO_CONTROLS_UPDATE.md)

## Test It

```bash
# Run the LTX test with new parameters
node test-ltx-live.mjs
```

## Need to Change Limits?

Edit `VIDEO_CONSTRAINTS` in the config file:

```typescript
export const VIDEO_CONSTRAINTS = {
  MAX_DURATION: 10,    // ← Change this
  MAX_FPS: 30,         // ← Change this
  MAX_WIDTH: 1920,     // ← Change this
  MAX_HEIGHT: 1080,    // ← Change this
  // ...
};
```

That's it! 🎉
