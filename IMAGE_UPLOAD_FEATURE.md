# Image Upload Feature for YouTube Generator

## Implementation Guide

### 1. Add state for image in `apps/web/src/app/dashboard/youtube/page.tsx`

```tsx
// Add after line 120 (with other state)
const [referenceImage, setReferenceImage] = useState<File | null>(null)
const [imagePreview, setImagePreview] = useState<string | null>(null)

// Add image handler
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    setReferenceImage(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }
}

const removeImage = () => {
  setReferenceImage(null)
  setImagePreview(null)
}
```

### 2. Update API calls to include image and disable_i2v

```tsx
// In handleDirectGenerate function (around line 210)
const handleDirectGenerate = async () => {
  if (topic.trim().length < 3) return
  setError(null)
  setDirectVideoUrl(null)
  setDirectProgress(0)
  setDirectMessage('Starting...')
  setView('generating')

  const clampedDuration = Math.min(Math.max(Math.round(duration), 2), 30)

  try {
    const formData = new FormData()
    formData.append('idea', topic.trim())
    formData.append('genre', genre)
    formData.append('aspectRatio', aspectRatio)
    formData.append('market', market)
    formData.append('duration', clampedDuration.toString())
    
    // Add image if present and set disable_i2v to false
    if (referenceImage) {
      formData.append('referenceImage', referenceImage)
      formData.append('disable_i2v', 'false')
    } else {
      formData.append('disable_i2v', 'true')
    }

    const { jobId } = await video.directGenerateWithImage(formData)
    setDirectJobId(jobId)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to start generation')
    setView('form')
  }
}
```

### 3. Add UI component in the form (after topic textarea)

```tsx
{/* Reference Image Upload */}
<div>
  <label className="block text-sm font-medium text-zinc-300 mb-2">
    Reference Image (Optional)
    <span className="text-xs text-zinc-500 ml-2">
      Upload an image to guide the video generation
    </span>
  </label>
  
  {!imagePreview ? (
    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-purple-500/50 hover:bg-zinc-900/50 transition-colors">
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <Upload className="w-8 h-8 text-zinc-500 mb-2" />
        <p className="text-sm text-zinc-500">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-zinc-600">PNG, JPG, WEBP (MAX. 10MB)</p>
      </div>
      <input
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />
    </label>
  ) : (
    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-zinc-700">
      <img
        src={imagePreview}
        alt="Reference"
        className="w-full h-full object-contain bg-zinc-900"
      />
      <button
        onClick={removeImage}
        className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )}
</div>
```

### 4. Update API client (`apps/web/src/lib/api.ts`)

```tsx
// Add new method
directGenerateWithImage: async (formData: FormData) => {
  const token = localStorage.getItem('jwt')
  const res = await fetch(`${API_URL}/video/direct-generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData, // Don't set Content-Type, browser will set it with boundary
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(err.message || 'Failed to start generation')
  }
  return res.json()
},
```

### 5. Update Backend DTO (`apps/backend/src/video-generation/dto/direct-generate.dto.ts`)

```tsx
import { IsString, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator'
import { Type } from 'class-transformer'

export class DirectGenerateDto {
  @IsString()
  idea: string

  @IsString()
  @IsOptional()
  genre?: string

  @IsString()
  @IsOptional()
  aspectRatio?: string

  @IsString()
  @IsOptional()
  market?: string

  @IsNumber()
  @Type(() => Number)
  @Min(2)
  @Max(30)
  @IsOptional()
  duration?: number

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  disable_i2v?: boolean

  // File will be handled by multer middleware
  referenceImage?: Express.Multer.File
}
```

### 6. Update Backend Controller to handle file upload

```tsx
import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Post('direct-generate')
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('referenceImage'))
async directGenerate(
  @Body() dto: DirectGenerateDto,
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: User,
) {
  if (file) {
    dto.referenceImage = file
    dto.disable_i2v = false // Force i2v when image is present
  }
  
  return this.videoGenerationService.directGenerate(dto, user)
}
```

## Summary

This implementation:
1. ✅ Adds image upload UI with preview
2. ✅ Sends image as FormData to backend
3. ✅ Automatically sets `disable_i2v: false` when image is uploaded
4. ✅ Sets `disable_i2v: true` when no image
5. ✅ Shows image preview with remove button
6. ✅ Validates image file types
7. ✅ Mobile-responsive design
