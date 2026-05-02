'use client'

import { useState } from 'react'
import { generateVideo, createVideoParams } from '../utils/videoGeneration'

export default function QuickVideoTest() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [videoPath, setVideoPath] = useState('')
  const [error, setError] = useState('')

  const handleQuickTest = async () => {
    setIsGenerating(true)
    setError('')
    setVideoPath('')
    setProgress('Starting...')

    try {
      const params = createVideoParams(
        'cinematic test, camera moving slowly, 4K',
        {
          width: 768,
          height: 432,
          length: 49, // ~2 secondes pour tester vite
          seed: 42,
          t2v_mode: true,
        }
      )

      const path = await generateVideo(
        params,
        `test_${Date.now()}.mp4`,
        (progressPayload) => {
          if (progressPayload.status === 'generating') {
            setProgress(
              `Generating... ${progressPayload.attempt}/${progressPayload.max}`
            )
          } else if (progressPayload.status === 'done') {
            setProgress('Complete!')
          } else if (progressPayload.status === 'error') {
            setError(progressPayload.message || 'Unknown error')
          }
        }
      )

      setVideoPath(path)
      console.log('✅ Video saved:', path)
    } catch (err) {
      setError(String(err))
      console.error('❌ Error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Quick Video Test</h2>

      <div className="space-y-4">
        <button
          onClick={handleQuickTest}
          disabled={isGenerating}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded font-semibold"
        >
          {isGenerating ? 'Generating...' : 'Generate Test Video (2s)'}
        </button>

        {progress && (
          <div className="text-sm text-gray-300">
            Status: {progress}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-500 rounded text-sm">
            {error}
          </div>
        )}

        {videoPath && (
          <div className="p-3 bg-green-900/50 border border-green-500 rounded">
            <p className="text-sm">✅ Video saved to: {videoPath}</p>
          </div>
        )}
      </div>
    </div>
  )
}
