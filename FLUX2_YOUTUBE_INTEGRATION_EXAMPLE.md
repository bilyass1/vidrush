# Flux2 Integration Example - YouTube Page

## Overview
This document shows how to integrate the Flux2 Image Generator into the YouTube page for generating custom thumbnails and reference images.

## Integration Steps

### 1. Import the Component

Add the import at the top of your YouTube page:

```typescript
import Flux2ImageGenerator from '@/components/youtube/Flux2ImageGenerator'
```

### 2. Add State Management

Add state variables to manage the generated images:

```typescript
const [showFlux2Generator, setShowFlux2Generator] = useState(false)
const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null)
```

### 3. Add UI Toggle Button

Add a button to show/hide the Flux2 generator:

```typescript
<button
  onClick={() => setShowFlux2Generator(!showFlux2Generator)}
  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold transition-all"
>
  <ImageIcon size={20} />
  Generate Thumbnail with AI
</button>
```

### 4. Add the Generator Component

Place the component in your page layout:

```typescript
{showFlux2Generator && (
  <div className="mt-8">
    <Flux2ImageGenerator 
      onImageGenerated={(imageUrl) => {
        setGeneratedThumbnail(imageUrl)
        setShowFlux2Generator(false)
        // Optionally show a success message
        console.log('Thumbnail generated:', imageUrl)
      }}
    />
  </div>
)}
```

### 5. Display Generated Thumbnail

Show the generated thumbnail in your UI:

```typescript
{generatedThumbnail && (
  <div className="mt-6 space-y-3">
    <label className="block text-sm font-medium text-zinc-300">
      Generated Thumbnail
    </label>
    <div className="relative w-full rounded-xl overflow-hidden border border-zinc-700">
      <img
        src={generatedThumbnail}
        alt="Generated Thumbnail"
        className="w-full h-auto"
      />
      <button
        onClick={() => setGeneratedThumbnail(null)}
        className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  </div>
)}
```

## Complete Example

Here's a complete example showing the integration:

```typescript
'use client'

import { useState } from 'react'
import { ImageIcon, X } from 'lucide-react'
import Flux2ImageGenerator from '@/components/youtube/Flux2ImageGenerator'

export default function YoutubeGeneratorPage() {
  const [showFlux2Generator, setShowFlux2Generator] = useState(false)
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null)
  
  // ... other state variables ...

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Header Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-4xl font-black text-white">YouTube Video Generator</h1>
        <p className="text-zinc-400 mt-2">Create amazing videos with AI</p>
      </div>

      {/* Flux2 Generator Toggle */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Custom Thumbnail</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Generate a custom thumbnail with AI
            </p>
          </div>
          <button
            onClick={() => setShowFlux2Generator(!showFlux2Generator)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold transition-all"
          >
            <ImageIcon size={20} />
            {showFlux2Generator ? 'Hide Generator' : 'Generate Thumbnail'}
          </button>
        </div>

        {/* Flux2 Generator */}
        {showFlux2Generator && (
          <Flux2ImageGenerator 
            onImageGenerated={(imageUrl) => {
              setGeneratedThumbnail(imageUrl)
              setShowFlux2Generator(false)
            }}
          />
        )}

        {/* Display Generated Thumbnail */}
        {generatedThumbnail && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-300">
              Generated Thumbnail
            </label>
            <div className="relative w-full rounded-xl overflow-hidden border border-zinc-700">
              <img
                src={generatedThumbnail}
                alt="Generated Thumbnail"
                className="w-full h-auto"
              />
              <button
                onClick={() => setGeneratedThumbnail(null)}
                className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                aria-label="Remove thumbnail"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-3">
              <a
                href={generatedThumbnail}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm text-center transition-all"
              >
                Download Thumbnail
              </a>
              <button
                onClick={() => {
                  // Use the thumbnail in your video generation
                  console.log('Using thumbnail:', generatedThumbnail)
                }}
                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all"
              >
                Use as Thumbnail
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rest of your page content */}
    </div>
  )
}
```

## Advanced Usage

### Auto-Generate Thumbnail from Video Topic

```typescript
const handleGenerateThumbnail = async () => {
  // Generate a prompt based on the video topic
  const thumbnailPrompt = `Professional YouTube thumbnail for a video about "${topic}", 
    ${genre} style, eye-catching, bold text overlay, high contrast, 
    cinematic lighting, 16:9 aspect ratio`
  
  // You can programmatically trigger the generation
  // by passing the prompt to the Flux2 service
}
```

### Use Generated Image as Video Reference

```typescript
const handleUseAsReference = (imageUrl: string) => {
  // Set the image as reference for video generation
  setReferenceImage(imageUrl)
  
  // Update the video generation parameters
  setVideoParams({
    ...videoParams,
    referenceImageUrl: imageUrl,
    useImageToVideo: true
  })
}
```

### Batch Thumbnail Generation

```typescript
const generateMultipleThumbnails = async () => {
  const prompts = [
    `${topic} - Style 1: Dramatic lighting`,
    `${topic} - Style 2: Minimalist design`,
    `${topic} - Style 3: Vibrant colors`
  ]
  
  const thumbnails = await Promise.all(
    prompts.map(prompt => generateThumbnail(prompt))
  )
  
  setThumbnailOptions(thumbnails)
}
```

## UI/UX Best Practices

### 1. Loading States
Show clear feedback during generation:
```typescript
{isGenerating && (
  <div className="flex items-center gap-2 text-zinc-400">
    <Loader2 className="animate-spin" size={16} />
    <span>Generating your thumbnail...</span>
  </div>
)}
```

### 2. Error Handling
Display user-friendly error messages:
```typescript
{error && (
  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
    <p className="text-sm text-red-400">{error}</p>
    <button 
      onClick={retryGeneration}
      className="mt-2 text-xs text-red-300 underline"
    >
      Try again
    </button>
  </div>
)}
```

### 3. Success Feedback
Confirm successful generation:
```typescript
{generatedThumbnail && (
  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
    <p className="text-sm text-green-400">
      ✓ Thumbnail generated successfully!
    </p>
  </div>
)}
```

## Styling Tips

### Match Your Brand
Customize the component colors to match your brand:
```typescript
<Flux2ImageGenerator 
  className="custom-flux2-generator"
  primaryColor="#your-brand-color"
  onImageGenerated={handleImageGenerated}
/>
```

### Responsive Design
Ensure the component works on all screen sizes:
```typescript
<div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
  <Flux2ImageGenerator onImageGenerated={handleImageGenerated} />
</div>
```

## Performance Optimization

### Lazy Loading
Load the component only when needed:
```typescript
import dynamic from 'next/dynamic'

const Flux2ImageGenerator = dynamic(
  () => import('@/components/youtube/Flux2ImageGenerator'),
  { ssr: false }
)
```

### Caching Generated Images
Store generated thumbnails to avoid regeneration:
```typescript
const [thumbnailCache, setThumbnailCache] = useState<Map<string, string>>(new Map())

const getCachedThumbnail = (prompt: string) => {
  return thumbnailCache.get(prompt)
}

const cacheThumbnail = (prompt: string, imageUrl: string) => {
  setThumbnailCache(prev => new Map(prev).set(prompt, imageUrl))
}
```

## Testing

### Manual Testing Checklist
- [ ] Component renders correctly
- [ ] Image upload works
- [ ] Generation completes successfully
- [ ] Error handling works
- [ ] Generated image displays correctly
- [ ] Download button works
- [ ] Mobile responsive

### Example Test Prompts
1. "Professional YouTube thumbnail, tech review style"
2. "Dramatic movie poster, action genre"
3. "Minimalist design, educational content"
4. "Vibrant gaming thumbnail, energetic"

## Troubleshooting

### Component Not Rendering
Check that the module is properly imported:
```typescript
import Flux2ImageGenerator from '@/components/youtube/Flux2ImageGenerator'
```

### Generation Fails
Verify the backend is running and ComfyUI is accessible:
```bash
curl http://localhost:3001/api/flux2/health
```

### Slow Performance
Enable turbo mode for faster generation:
```typescript
<Flux2ImageGenerator 
  defaultTurboMode={true}
  onImageGenerated={handleImageGenerated}
/>
```

## Related Documentation
- [Flux2 Image Generation](./FLUX2_IMAGE_GENERATION.md)
- [Guide Rapide FR](./FLUX2_GUIDE_RAPIDE_FR.md)
- [Architecture](./ARCHITECTURE.md)
