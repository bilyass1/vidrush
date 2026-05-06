'use client'

// Flux2 Image Generator Component
import { useState, useEffect } from 'react'
import { flux2 } from '@/lib/api'
import { Sparkles, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Flux2ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void
  initialPrompt?: string
}

export default function Flux2ImageGenerator({ onImageGenerated, initialPrompt }: Flux2ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [referenceImage, setReferenceImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enableTurbo, setEnableTurbo] = useState(true)
  const [steps, setSteps] = useState(8)

  // Update prompt when initialPrompt changes
  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt)
    }
  }, [initialPrompt])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB')
        return
      }
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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedImage(null)

    try {
      const formData = new FormData()
      formData.append('prompt', prompt)
      formData.append('enableTurbo', enableTurbo.toString())
      formData.append('steps', steps.toString())
      formData.append('width', '1024')
      formData.append('height', '1024')
      formData.append('guidance', '4')

      if (referenceImage) {
        formData.append('referenceImage', referenceImage)
      }

      const result = await flux2.generateImage(formData)
      setGeneratedImage(result.data.imagePath)
      
      if (onImageGenerated) {
        onImageGenerated(result.data.imagePath)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <ImageIcon size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Flux2 Image Generator</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Generate AI images with Flux2 model</p>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-zinc-300">
          Image Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
          className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition-all resize-none text-sm"
        />
      </div>

      {/* Reference Image Upload */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-zinc-300">
          Reference Image (Optional)
        </label>
        
        {!imagePreview ? (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-purple-500/50 hover:bg-zinc-800/50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 text-zinc-500 mb-2" />
              <p className="text-sm text-zinc-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-zinc-600 mt-1">PNG, JPG, WEBP (MAX. 10MB)</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>
        ) : (
          <div className="relative w-full h-48 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950">
            <img
              src={imagePreview}
              alt="Reference"
              className="w-full h-full object-contain"
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

      {/* Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={enableTurbo}
              onChange={(e) => {
                setEnableTurbo(e.target.checked)
                setSteps(e.target.checked ? 8 : 20)
              }}
              className="rounded border-zinc-700 bg-zinc-950 text-purple-600 focus:ring-purple-600/50"
            />
            Turbo Mode (8 steps)
          </label>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm text-zinc-300">
            Steps: {steps}
          </label>
          <input
            type="range"
            min={4}
            max={50}
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className={cn(
          'w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2',
          isGenerating || !prompt.trim()
            ? 'bg-zinc-800 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-600/20'
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Generate Image
          </>
        )}
      </button>

      {/* Generated Image */}
      {generatedImage && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300">
            Generated Image
          </label>
          <div className="relative w-full rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950">
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full h-auto"
            />
          </div>
          <div className="flex gap-3">
            <a
              href={generatedImage}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm text-center transition-all"
            >
              Download Image
            </a>
            <button
              onClick={() => {
                if (onImageGenerated) {
                  onImageGenerated(generatedImage)
                }
              }}
              className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all"
            >
              Use This Image
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
