# Video Generation Constraints Guide

## Overview

The video generation system now enforces configurable constraints to ensure optimal performance and resource management. These constraints are centrally managed in `apps/backend/src/video-generation/config/video-constraints.config.ts`.

## Current Constraints

### Maximum Values
- **Duration**: 10 seconds maximum
- **FPS (Frames Per Second)**: 30 fps maximum
- **Resolution**: 1920x1080 (1080p) maximum

### Default Values
- **Duration**: 5 seconds
- **FPS**: 25 fps
- **Resolution**: 1280x720 (720p)

## Aspect Ratio Presets

The system supports the following aspect ratios with HD quality:

| Aspect Ratio | Resolution | Use Case |
|--------------|------------|----------|
| 16:9 | 1920x1080 | Full HD landscape (YouTube, TV) |
| 9:16 | 608x1080 | Vertical HD (TikTok, Instagram Stories) |
| 1:1 | 1024x1024 | Square HD (Instagram Feed) |
| 4:5 | 864x1080 | Portrait HD (Instagram Feed) |

## Quality Presets

Three quality presets are available for easy selection:

| Preset | Resolution | FPS | Description |
|--------|------------|-----|-------------|
| LOW | 640x360 | 15 | 360p - Fast generation, lower quality |
| MEDIUM | 1280x720 | 25 | 720p - Balanced quality and speed |
| HIGH | 1920x1080 | 30 | 1080p - Best quality, slower generation |

## How Constraints Are Applied

1. **User Input**: User provides desired parameters (width, height, fps, duration)
2. **Validation**: System validates and constrains values to maximum limits
3. **Workflow Patching**: Constrained values are applied to the ComfyUI workflow
4. **Generation**: Video is generated with the constrained parameters

### Example Flow

```typescript
// User requests
{
  width: 2560,      // Exceeds max
  height: 1440,     // Exceeds max
  fps: 60,          // Exceeds max
  duration: 15      // Exceeds max
}

// System constrains to
{
  width: 1920,      // Capped at MAX_WIDTH
  height: 1080,     // Capped at MAX_HEIGHT
  fps: 30,          // Capped at MAX_FPS
  duration: 10      // Capped at MAX_DURATION
}
```

## Modifying Constraints

To adjust the constraints, edit `apps/backend/src/video-generation/config/video-constraints.config.ts`:

```typescript
export const VIDEO_CONSTRAINTS = {
  MAX_DURATION: 10,    // Change this to adjust max duration
  MAX_FPS: 30,         // Change this to adjust max fps
  MAX_WIDTH: 1920,     // Change this to adjust max width
  MAX_HEIGHT: 1080,    // Change this to adjust max height
  
  DEFAULT_FPS: 25,
  DEFAULT_DURATION: 5,
  DEFAULT_WIDTH: 1280,
  DEFAULT_HEIGHT: 720,
} as const;
```

## API Usage

### LTX Service

```typescript
import { LtxService } from './ltx.service';

// The service automatically applies constraints
const response = await ltxService.generateClipWithRetry({
  prompt: "A cinematic scene...",
  width: 1920,
  height: 1080,
  duration: 10,
  fps: 30,
});
```

### Direct Video Service

```typescript
// The DirectVideoService uses aspect ratio presets
// and automatically applies constraints
const input: DirectGenerateInput = {
  videoGenerationId: "...",
  userId: "...",
  idea: "A cinematic scene...",
  genre: "action",
  aspectRatio: "16:9",  // Uses 1920x1080 preset
  duration: 8,          // Will be constrained to max 10s
  market: "youtube",
};

await directVideoService.generate(input);
```

## Performance Considerations

- **Higher resolution** = Longer generation time
- **Higher FPS** = More frames to generate = Longer time
- **Longer duration** = More frames to generate = Longer time

### Estimated Generation Times

| Quality | Duration | Approximate Time |
|---------|----------|------------------|
| 720p @ 25fps | 5s | 2-3 minutes |
| 1080p @ 25fps | 5s | 3-5 minutes |
| 1080p @ 30fps | 10s | 8-12 minutes |

*Times are approximate and depend on server load and hardware*

## ComfyUI Workflow Integration

The constraints are applied to the ComfyUI workflow JSON by patching specific nodes:

- **Node 267:257**: Width (PrimitiveInt)
- **Node 267:258**: Height (PrimitiveInt)
- **Node 267:260**: Frame Rate (PrimitiveInt)
- **Node 267:225**: Duration (PrimitiveInt)

The workflow automatically calculates the number of frames using the formula:
```
frames = duration * fps + 1
```

## Troubleshooting

### Video generation fails with high settings
- Try reducing resolution to 720p
- Reduce FPS to 25
- Reduce duration to 5 seconds

### Video quality is poor
- Increase resolution to 1080p
- Ensure FPS is at least 25
- Check prompt quality and detail

### Generation takes too long
- Use MEDIUM or LOW quality preset
- Reduce duration
- Use lower FPS (15-20)

## Future Enhancements

Potential improvements to the constraint system:

1. **User-specific limits**: Different limits for free vs premium users
2. **Dynamic constraints**: Adjust based on server load
3. **Quality profiles**: Predefined profiles for different use cases
4. **Batch processing**: Queue multiple videos with different constraints
5. **Progressive generation**: Generate lower quality preview first
