# Video Generation API - Frontend Integration

## Quick Start

```typescript
import { generateVideo, createVideoParams } from './utils/videoGeneration'

// Generate a video
const params = createVideoParams('cinematic battle scene', {
  width: 1080,
  height: 720,
  seed: 42,
})

const videoPath = await generateVideo(params, 'output.mp4')
console.log('Video saved:', videoPath)
```

## API Reference

### `generateVideo(params, savePath, onProgress?)`

Generate a video using the LTX model.

**Parameters:**
- `params: VideoParams` - Video generation parameters
- `savePath: string` - Where to save the generated video
- `onProgress?: (payload: ProgressPayload) => void` - Optional progress callback

**Returns:** `Promise<string>` - Path to the generated video

### `createVideoParams(prompt, options?)`

Helper to create video parameters with sensible defaults.

**Parameters:**
- `prompt: string` - Main prompt describing the video
- `options?: Partial<VideoParams>` - Optional overrides

**Returns:** `VideoParams`

### `cancelVideoGeneration()`

Cancel the current video generation.

**Returns:** `Promise<void>`

### `getQueueStatus()`

Get the current ComfyUI queue status.

**Returns:** `Promise<any>`

## VideoParams Interface

```typescript
interface VideoParams {
  prompt: string                // Main prompt
  negative_prompt?: string      // What to avoid
  width: number                 // Video width (default: 1080)
  height: number                // Video height (default: 720)
  length: number                // Number of frames (default: 193 ≈ 8s)
  frame_rate: number            // FPS (default: 25)
  seed: number                  // Random seed
  image_path?: string           // For image-to-video mode
  t2v_mode: boolean            // true = text-to-video, false = image-to-video
}
```

## Progress Events

The `onProgress` callback receives updates with this structure:

```typescript
interface ProgressPayload {
  status: 'generating' | 'done' | 'error'
  attempt?: number      // Current attempt (for generating status)
  max?: number         // Max attempts (for generating status)
  filename?: string    // Generated filename (for done status)
  message?: string     // Error message (for error status)
}
```

## Examples

### Text-to-Video

```typescript
const params = createVideoParams(
  'cinematic battle scene, soldiers running forward',
  {
    negative_prompt: 'static, blurry, cartoon',
    width: 1080,
    height: 720,
    seed: Math.floor(Math.random() * 999999999),
  }
)

const videoPath = await generateVideo(
  params,
  `output_${Date.now()}.mp4`,
  (progress) => {
    if (progress.status === 'generating') {
      console.log(`${progress.attempt}/${progress.max}`)
    }
  }
)
```

### Image-to-Video

```typescript
const params = createVideoParams(
  'camera slowly zooming in, cinematic movement',
  {
    image_path: '/path/to/image.png',
    t2v_mode: false,
  }
)

const videoPath = await generateVideo(params, 'i2v_output.mp4')
```

### With Progress Tracking

```typescript
const [progress, setProgress] = useState(0)
const [status, setStatus] = useState('')

const params = createVideoParams('epic landscape')

await generateVideo(params, 'output.mp4', (payload) => {
  if (payload.status === 'generating' && payload.attempt && payload.max) {
    setProgress((payload.attempt / payload.max) * 100)
    setStatus(`Generating... ${payload.attempt}/${payload.max}`)
  } else if (payload.status === 'done') {
    setProgress(100)
    setStatus('Complete!')
  } else if (payload.status === 'error') {
    setStatus(`Error: ${payload.message}`)
  }
})
```

## React Component Example

See `src/components/VideoGenerator.tsx` for a complete React component implementation.

## Notes

- Default video length is 193 frames (~8 seconds at 25fps)
- Generation can take 5-15 minutes depending on settings
- ComfyUI must be running at the configured URL
- Progress updates come every ~3 seconds
- Maximum timeout is 15 minutes (300 attempts × 3 seconds)
