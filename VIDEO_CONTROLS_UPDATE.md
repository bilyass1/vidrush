# Video Generation Controls Update

## Summary

The video generation system has been updated to give users full control over video quality, duration, and frame rate with enforced constraints for optimal performance.

## ✅ What's New

### User-Controllable Parameters

1. **Duration Control**: 1-10 seconds (max 10 seconds)
2. **Quality Control**: Up to 1080p (max 1920x1080)
3. **FPS Control**: Up to 30 fps (max 30 fps)

### Automatic Constraint Enforcement

The system now automatically caps values at maximum limits:
- Duration > 10s → Capped at 10s
- Resolution > 1080p → Capped at 1080p
- FPS > 30 → Capped at 30 fps

## 📁 Files Modified

### 1. **apps/backend/src/video-generation/services/ltx.service.ts**
- Added `duration` parameter to `LtxGenerateRequest` interface
- Updated `patchWorkflow()` to apply constraints using centralized config
- Improved logging to show constrained values
- Now uses `constrainVideoParams()` helper function

### 2. **apps/backend/src/video-generation/services/direct-video.service.ts**
- Updated aspect ratio presets to HD quality (1080p)
- Integrated with centralized constraint configuration
- Improved parameter validation and logging
- Now uses `ASPECT_RATIO_PRESETS` from config

### 3. **apps/backend/src/video-generation/config/video-constraints.config.ts** ⭐ NEW
- Centralized configuration for all video constraints
- Defines maximum and default values
- Provides aspect ratio presets
- Includes quality presets (LOW, MEDIUM, HIGH)
- Exports `constrainVideoParams()` helper function

## 📚 Documentation Added

### 1. **VIDEO_CONSTRAINTS_GUIDE.md** ⭐ NEW
Technical documentation for developers:
- Detailed explanation of constraints
- How constraints are applied
- API usage examples
- Performance considerations
- Troubleshooting guide

### 2. **USER_VIDEO_CONTROLS.md** ⭐ NEW
User-friendly guide:
- Quick reference table
- Quality presets explained
- Use case recommendations
- API examples
- Tips for best results

### 3. **VIDEO_CONTROLS_UPDATE.md** ⭐ NEW (this file)
Summary of all changes

## 🔧 Technical Implementation

### Constraint Flow

```
User Input → Validation → Constraint Application → Workflow Patching → Video Generation
```

### Key Functions

#### `constrainVideoParams()`
```typescript
// Validates and constrains all parameters
const constrained = constrainVideoParams({
  width: 2560,    // → 1920 (capped)
  height: 1440,   // → 1080 (capped)
  fps: 60,        // → 30 (capped)
  duration: 15    // → 10 (capped)
});
```

#### `patchWorkflow()`
```typescript
// Applies constrained values to ComfyUI workflow
const patched = this.patchWorkflow(workflow, {
  prompt: "...",
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 10
});
```

## 📊 Quality Presets

| Preset | Resolution | FPS | Use Case |
|--------|------------|-----|----------|
| LOW | 640x360 | 15 | Fast previews |
| MEDIUM | 1280x720 | 25 | Social media (recommended) |
| HIGH | 1920x1080 | 30 | Professional videos |

## 🎯 Aspect Ratio Presets

| Ratio | Resolution | Platform |
|-------|------------|----------|
| 16:9 | 1920x1080 | YouTube, landscape |
| 9:16 | 608x1080 | TikTok, Stories |
| 1:1 | 1024x1024 | Instagram feed |
| 4:5 | 864x1080 | Instagram portrait |

## 🚀 Usage Examples

### Example 1: Quick Social Media Video
```typescript
await ltxService.generateClipWithRetry({
  prompt: "Product showcase with smooth camera movement",
  width: 1280,
  height: 720,
  fps: 25,
  duration: 5
});
```

### Example 2: High-Quality Professional Video
```typescript
await ltxService.generateClipWithRetry({
  prompt: "Cinematic scene with detailed textures",
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 10
});
```

### Example 3: Fast Preview
```typescript
await ltxService.generateClipWithRetry({
  prompt: "Test scene",
  width: 640,
  height: 360,
  fps: 15,
  duration: 3
});
```

## ⚙️ Configuration

To modify constraints, edit `apps/backend/src/video-generation/config/video-constraints.config.ts`:

```typescript
export const VIDEO_CONSTRAINTS = {
  MAX_DURATION: 10,     // Change max duration
  MAX_FPS: 30,          // Change max FPS
  MAX_WIDTH: 1920,      // Change max width
  MAX_HEIGHT: 1080,     // Change max height
  
  DEFAULT_FPS: 25,
  DEFAULT_DURATION: 5,
  DEFAULT_WIDTH: 1280,
  DEFAULT_HEIGHT: 720,
} as const;
```

## 📈 Performance Impact

| Quality | Duration | Est. Generation Time |
|---------|----------|---------------------|
| 360p @ 15fps | 3s | ~1-2 minutes |
| 720p @ 25fps | 5s | ~3-5 minutes |
| 1080p @ 30fps | 10s | ~8-12 minutes |

## ✨ Benefits

1. **User Control**: Users can now choose quality vs speed trade-offs
2. **Resource Protection**: Automatic constraints prevent resource exhaustion
3. **Centralized Config**: Easy to adjust limits in one place
4. **Better UX**: Clear expectations about generation times
5. **Flexibility**: Support for multiple use cases (preview, social, professional)

## 🔄 Backward Compatibility

All existing code continues to work:
- Default values are applied when parameters are not specified
- Existing API calls work without modification
- Constraints are applied transparently

## 🧪 Testing

To test the new constraints:

```bash
# Test with default values
npm run test:ltx

# Test with custom values
# Edit test-ltx-live.mjs to include:
# width: 1920, height: 1080, fps: 30, duration: 10
```

## 📝 Next Steps

Potential future enhancements:
1. Add UI controls for quality selection
2. Implement user-tier based limits (free vs premium)
3. Add progress estimation based on parameters
4. Create quality comparison tool
5. Add batch processing with different quality settings

## 🐛 Troubleshooting

### Issue: Generation takes too long
**Solution**: Reduce resolution, FPS, or duration

### Issue: Quality not good enough
**Solution**: Increase resolution to 1080p and FPS to 30

### Issue: Parameters not being applied
**Solution**: Check logs for constraint application messages

## 📞 Support

For questions or issues:
- See [VIDEO_CONSTRAINTS_GUIDE.md](./VIDEO_CONSTRAINTS_GUIDE.md) for technical details
- See [USER_VIDEO_CONTROLS.md](./USER_VIDEO_CONTROLS.md) for user guide
- Check the configuration file for current limits

---

**Update Date**: 2026-05-06
**Version**: 1.0.0
**Status**: ✅ Complete and tested
