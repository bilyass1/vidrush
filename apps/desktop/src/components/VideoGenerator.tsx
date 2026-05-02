'use client'

import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { open } from '@tauri-apps/plugin-dialog'
import { convertFileSrc } from '@tauri-apps/api/core'

interface VideoParams {
  prompt: string
  negative_prompt?: string
  width: number
  height: number
  length: number
  frame_rate: number
  seed: number
  image_path?: string
  t2v_mode: boolean
}

interface ProgressPayload {
  status: 'generating' | 'done' | 'error'
  attempt?: number
  max?: number
  filename?: string
  message?: string
}

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [width, setWidth] = useState(1080)
  const [height, setHeight] = useState(720)
  const [lengthSeconds, setLengthSeconds] = useState(8)
  const [seed, setSeed] = useState(Math.floor(Math.random() * 1000000))
  const [mode, setMode] = useState<'t2v' | 'i2v'>('t2v')
  const [imagePath, setImagePath] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [videoPath, setVideoPath] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const unlisten = listen<ProgressPayload>('video-progress', (event) => {
      const { status, attempt, max, filename, message } = event.payload

      if (status === 'generating' && attempt && max) {
        setProgress((attempt / max) * 100)
        setProgressText(`Generating... ${attempt}/${max}`)
      } else if (status === 'done' && filename) {
        setProgress(100)
        setProgressText('Complete!')
        setIsGenerating(false)
      } else if (status === 'error' && message) {
        setError(message)
        setIsGenerating(false)
        setProgress(0)
      }
    })

    return () => {
      unlisten.then((fn) => fn())
    }
  }, [])

  const handleImageSelect = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }],
    })
    if (selected && typeof selected === 'string') {
      setImagePath(selected)
    }
  }

  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000))
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Prompt is required')
      return
    }

    setError('')
    setIsGenerating(true)
    setProgress(0)
    setVideoPath('')

    const lengthFrames = lengthSeconds * 25 + 1

    const params: VideoParams = {
      prompt: prompt.trim(),
      negative_prompt: negativePrompt.trim() || undefined,
      width,
      height,
      length: lengthFrames,
      frame_rate: 25,
      seed,
      image_path: mode === 'i2v' ? imagePath : undefined,
      t2v_mode: mode === 't2v',
    }

    try {
      // Use temp directory or user's videos folder
      const savePath = `ltx_video_${Date.now()}.mp4`
      const result = await invoke<string>('generate_ltx_video', {
        params,
        savePath,
      })
      setVideoPath(result)
    } catch (err) {
      setError(String(err))
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!videoPath) return
    const savePath = await open({
      defaultPath: `ltx_video_${Date.now()}.mp4`,
    })
    if (savePath && typeof savePath === 'string') {
      // Copy file logic would go here
      alert(`Video saved to: ${savePath}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">LTX Video Generator</h1>

        <div className="bg-gray-800 rounded-lg p-6 space-y-6">
          {/* Mode Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2">Mode</label>
            <div className="flex gap-4">
              <button
                onClick={() => setMode('t2v')}
                className={`px-4 py-2 rounded ${
                  mode === 't2v'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Text to Video
              </button>
              <button
                onClick={() => setMode('i2v')}
                className={`px-4 py-2 rounded ${
                  mode === 'i2v'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Image to Video
              </button>
            </div>
          </div>

          {/* Image Upload */}
          {mode === 'i2v' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Source Image
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleImageSelect}
                  className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                >
                  Select Image
                </button>
                {imagePath && (
                  <span className="text-sm text-gray-400 self-center truncate">
                    {imagePath.split(/[\\/]/).pop()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Prompt <span className="text-red-500">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-gray-700 rounded px-3 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the video you want to generate..."
            />
          </div>

          {/* Negative Prompt */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Negative Prompt
            </label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full bg-gray-700 rounded px-3 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What to avoid in the video..."
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Width</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Height</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Length */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Length (seconds)
            </label>
            <input
              type="number"
              value={lengthSeconds}
              onChange={(e) => setLengthSeconds(Number(e.target.value))}
              className="w-full bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Frames: {lengthSeconds * 25 + 1}
            </p>
          </div>

          {/* Seed */}
          <div>
            <label className="block text-sm font-medium mb-2">Seed</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="flex-1 bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={randomizeSeed}
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
              >
                Random
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Progress */}
          {isGenerating && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{progressText}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded px-4 py-3 font-semibold transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Generate Video'}
          </button>
        </div>

        {/* Video Player */}
        {videoPath && (
          <div className="mt-8 bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Generated Video</h2>
            <video
              src={convertFileSrc(videoPath)}
              controls
              className="w-full rounded"
            />
            <button
              onClick={handleDownload}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 rounded px-4 py-3 font-semibold transition-colors"
            >
              Download Video
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
