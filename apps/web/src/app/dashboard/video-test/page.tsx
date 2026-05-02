'use client'

import { useState } from 'react'
import { ChevronLeft, Play } from 'lucide-react'
import Link from 'next/link'

export default function VideoTestPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  const handleQuickTest = async () => {
    setIsGenerating(true)
    setError('')
    setProgress('Starting generation...')

    try {
      // Check if we're in Tauri
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { invoke } = await import('@tauri-apps/api/core')
        const { listen } = await import('@tauri-apps/api/event')

        // Listen to progress
        const unlisten = await listen('video-progress', (event: any) => {
          const { status, attempt, max, message } = event.payload
          if (status === 'generating') {
            setProgress(`Generating... ${attempt}/${max}`)
          } else if (status === 'done') {
            setProgress('✅ Complete!')
            setIsGenerating(false)
          } else if (status === 'error') {
            setError(message || 'Unknown error')
            setIsGenerating(false)
          }
        })

        const params = {
          prompt: 'cinematic test, camera moving slowly, 4K',
          negative_prompt: 'static, blurry, cartoon',
          width: 768,
          height: 432,
          length: 49, // ~2 seconds
          frame_rate: 25,
          seed: 42,
          image_path: null,
          t2v_mode: true,
        }

        const result = await invoke('generate_ltx_video', {
          params,
          savePath: `test_${Date.now()}.mp4`,
        })

        console.log('✅ Video saved:', result)
        unlisten()
      } else {
        setError('This feature only works in the desktop app')
        setIsGenerating(false)
      }
    } catch (err) {
      setError(String(err))
      setIsGenerating(false)
      console.error('❌ Error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-sm font-semibold">Video Generation Test</h1>
            <p className="text-xs text-zinc-500">Quick LTX test (2 seconds)</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Quick Test Parameters</h2>
            <div className="text-sm text-zinc-400 space-y-1">
              <p>• Prompt: "cinematic test, camera moving slowly, 4K"</p>
              <p>• Resolution: 768x432</p>
              <p>• Length: 49 frames (~2 seconds)</p>
              <p>• Seed: 42</p>
            </div>
          </div>

          <button
            onClick={handleQuickTest}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            <Play size={20} />
            {isGenerating ? 'Generating...' : 'Generate Test Video'}
          </button>

          {progress && (
            <div className="p-4 bg-blue-950/30 border border-blue-800/50 rounded-lg">
              <p className="text-sm text-blue-300">{progress}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-lg">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-800">
            <h3 className="text-sm font-semibold mb-2">Note</h3>
            <p className="text-xs text-zinc-500">
              This test requires the desktop app with ComfyUI running. Make sure
              ComfyUI is accessible at the configured URL.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
