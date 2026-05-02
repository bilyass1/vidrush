'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { X, Youtube, Upload, CheckCircle2, ExternalLink, Copy, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { youtube } from '@/lib/api'
import type { VideoGeneration } from '@vidrush/shared'

interface Props {
  video: VideoGeneration
  isOpen: boolean
  onClose: () => void
  onPublished: (youtubeUrl: string) => void
}

type Step = 'form' | 'uploading' | 'done'

export default function PublishModal({ video, isOpen, onClose, onPublished }: Props) {
  const [step, setStep] = useState<Step>('form')
  const [title, setTitle] = useState(video.inputPrompt.slice(0, 100))
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>('public')
  const [isShort, setIsShort] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const socketRef = useRef<Socket | null>(null)

  // Check if YouTube is connected
  useEffect(() => {
    if (!isOpen) return
    youtube.getChannel().then((ch) => setIsConnected(ch !== null)).catch(() => setIsConnected(false))
  }, [isOpen])

  // WebSocket for upload progress
  useEffect(() => {
    if (step !== 'uploading') return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    const socketUrl = apiUrl.replace('/api', '')
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null

    const socket = io(`${socketUrl}/video-progress`, {
      auth: { token },
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on('youtube:upload_progress', (data: { progress: number; youtubeVideoId?: string }) => {
      setUploadProgress(data.progress)
    })

    return () => {
      socket.disconnect()
    }
  }, [step])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStep('uploading')
    setUploadProgress(0)

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const result = await youtube.upload({
        videoGenerationId: video.id,
        title,
        description,
        tags,
        privacy,
        isShort,
        scheduledAt: scheduledAt || undefined,
      })

      setYoutubeUrl(result.youtubeUrl)
      setStep('done')
      onPublished(result.youtubeUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStep('form')
    }
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(youtubeUrl)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Youtube size={18} className="text-red-500" />
            <h2 className="text-white font-semibold">Publish to YouTube</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Not connected state */}
          {isConnected === false && (
            <div className="text-center space-y-4 py-4">
              <Youtube size={40} className="mx-auto text-red-500" />
              <p className="text-white font-medium">YouTube not connected</p>
              <p className="text-sm text-zinc-500">
                Connect your YouTube channel in{' '}
                <a href="/dashboard/settings?tab=youtube" className="text-purple-400 hover:underline">
                  Settings
                </a>{' '}
                to publish videos.
              </p>
            </div>
          )}

          {/* Uploading state */}
          {step === 'uploading' && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-3">
                <Loader2 size={20} className="text-red-400 animate-spin" />
                <p className="text-white font-medium">Uploading to YouTube...</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Progress</span>
                  <span className="text-purple-400 font-bold">{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500 text-center">
                This may take a few minutes depending on video size.
              </p>
            </div>
          )}

          {/* Done state */}
          {step === 'done' && (
            <div className="space-y-5 py-2">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                <div className="bg-green-500 rounded-full p-1 shrink-0">
                  <CheckCircle2 size={18} className="text-zinc-950" />
                </div>
                <div>
                  <p className="text-green-400 font-bold">Published to YouTube!</p>
                  <p className="text-green-500/70 text-xs">Your video is now live.</p>
                </div>
              </div>

              <div className="bg-zinc-800 rounded-xl p-3 flex items-center gap-2">
                <span className="text-zinc-300 text-sm truncate flex-1">{youtubeUrl}</span>
                <button
                  onClick={copyUrl}
                  className="shrink-0 p-1.5 text-zinc-500 hover:text-white transition-colors"
                  title="Copy URL"
                >
                  <Copy size={14} />
                </button>
              </div>

              <div className="flex gap-3">
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <ExternalLink size={14} /> View on YouTube
                </a>
                <button
                  onClick={copyUrl}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
                >
                  <Copy size={14} /> Copy URL
                </button>
              </div>
            </div>
          )}

          {/* Form state */}
          {step === 'form' && isConnected !== false && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 transition-colors"
                />
                <p className="text-right text-xs text-zinc-600 mt-1">{title.length}/100</p>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={5000}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  Tags <span className="text-zinc-600">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="history, documentary, education"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Privacy</label>
                  <select
                    value={privacy}
                    onChange={(e) => setPrivacy(e.target.value as typeof privacy)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 transition-colors"
                  >
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Schedule (optional)</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsShort(!isShort)}
                  className={cn(
                    'relative w-9 h-5 rounded-full transition-colors shrink-0',
                    isShort ? 'bg-purple-600' : 'bg-zinc-700'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm',
                      isShort ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </button>
                <span className="text-sm text-zinc-400">Mark as YouTube Short</span>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors mt-2"
              >
                <Upload size={16} /> Publish to YouTube
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
