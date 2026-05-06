'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { video } from '@/lib/api'
import type { GenerationResult } from '@/lib/api'
import BubbleCanvas from '@/components/dashboard/BubbleCanvas'
import ResultPanel from '@/components/dashboard/ResultPanel'
import VideoCard, { VideoCardSkeleton } from '@/components/dashboard/VideoCard'
import PublishModal from '@/components/dashboard/PublishModal'
import VoiceTestPanel from '@/components/dashboard/VoiceTestPanel'
import PipelineSelector from '@/components/youtube/PipelineSelector'
import FreePipelineProgress from '@/components/youtube/FreePipelineProgress'
import {
  Sparkles,
  AlertCircle,
  FileText,
  Skull,
  Search,
  GraduationCap,
  Globe,
  Laugh,
  Landmark,
  Ghost,
  FlaskConical,
  Newspaper,
  Flame,
  Monitor,
  Smartphone,
  Square,
  Upload,
  X,
} from 'lucide-react'
import { NeuralLoader } from '@/components/NeuralLoader'
import { cn } from '@/lib/utils'
import type { VideoGeneration } from '@vidrush/shared'

// ─── Constants ──────────────────────────────────────────────

const GENRES = [
  { id: 'Documentary', label: 'Documentary', desc: 'Fact-based storytelling', icon: FileText },
  { id: 'Dark History', label: 'Dark History', desc: 'Mysterious past events', icon: Skull },
  { id: 'True Crime', label: 'True Crime', desc: 'Real investigations', icon: Search },
  { id: 'Educational', label: 'Educational', desc: 'Learning & growth', icon: GraduationCap },
  { id: 'Funny', label: 'Funny', desc: 'Comedy & entertainment', icon: Laugh },
  { id: 'History', label: 'History', desc: 'Epic historical stories', icon: Landmark },
  { id: 'Horror', label: 'Horror', desc: 'Scary & unsettling', icon: Ghost },
  { id: 'Science', label: 'Science', desc: 'Mind-blowing discoveries', icon: FlaskConical },
  { id: 'News', label: 'News', desc: 'Breaking & current events', icon: Newspaper },
  { id: 'Motivation', label: 'Motivation', desc: 'Inspiring & uplifting', icon: Flame },
] as const

const ASPECT_RATIOS = [
  {
    id: '16:9',
    label: '16:9',
    desc: 'YouTube / Landscape',
    subdesc: 'Standard widescreen',
    icon: Monitor,
    shape: 'w-14 h-8',
  },
  {
    id: '9:16',
    label: '9:16',
    desc: 'Shorts / TikTok',
    subdesc: 'Vertical mobile',
    icon: Smartphone,
    shape: 'w-6 h-10',
  },
  {
    id: '1:1',
    label: '1:1',
    desc: 'Instagram Square',
    subdesc: 'Social feed',
    icon: Square,
    shape: 'w-9 h-9',
  },
  {
    id: '4:5',
    label: '4:5',
    desc: 'Instagram Portrait',
    subdesc: 'Feed / Stories',
    icon: Smartphone,
    shape: 'w-7 h-9',
  },
] as const

const MARKETS = [
  { id: 'en-us', label: 'US English', icon: '🇺🇸' },
  { id: 'en-uk', label: 'UK English', icon: '🇬🇧' },
  { id: 'fr', label: 'French', icon: '🇫🇷' },
  { id: 'ar', label: 'Arabic', icon: '🇸🇦' },
] as const

const QUALITY_PRESETS = [
  { id: 'low', label: 'Low (360p)', width: 640, height: 360, fps: 15, desc: 'Fast preview', time: '~1-2 min', icon: '⚡' },
  { id: 'medium', label: 'Medium (720p)', width: 1280, height: 720, fps: 25, desc: 'Social media', time: '~3-5 min', icon: '⭐' },
  { id: 'high', label: 'High (1080p)', width: 1920, height: 1080, fps: 30, desc: 'Professional', time: '~8-12 min', icon: '🎬' },
] as const

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  if (sec === 0) return `${min}min`
  return `${min}min ${sec}s`
}

// ─── Page Component ─────────────────────────────────────────

type PageView = 'form' | 'loading' | 'result' | 'generating'

export default function YoutubeGeneratorPage() {
  useAuth()
  const router = useRouter()

  // Form state
  const [topic, setTopic] = useState('')
  const [genre, setGenre] = useState<string>('Documentary')
  const [aspectRatio, setAspectRatio] = useState<string>('16:9')
  const [market, setMarket] = useState<string>('en-us')
  const [duration, setDuration] = useState(5) // Default 5 seconds (max 10s)
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [customFps, setCustomFps] = useState<number | null>(null)
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null)
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null)
  const [pipeline, setPipeline] = useState<'free' | 'premium'>('free')
  const [referenceImage, setReferenceImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Page state
  const [view, setView] = useState<PageView>('form')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [activePipeline, setActivePipeline] = useState<'free' | 'premium'>('free')
  const [scriptReady, setScriptReady] = useState(false)
  const scriptResultRef = useRef<GenerationResult | null>(null)

  // Direct generation state
  const [directJobId, setDirectJobId] = useState<string | null>(null)
  const [directProgress, setDirectProgress] = useState(0)
  const [directMessage, setDirectMessage] = useState('')
  const [directVideoUrl, setDirectVideoUrl] = useState<string | null>(null)

  // Recent videos
  const [recentVideos, setRecentVideos] = useState<VideoGeneration[]>([])
  const [videosLoading, setVideosLoading] = useState(true)
  const [publishingVideo, setPublishingVideo] = useState<VideoGeneration | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadVideos = useCallback(async () => {
    try {
      const vids = await video.recent(12)
      setRecentVideos(vids)
    } catch { /* ignore */ } finally {
      setVideosLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  useEffect(() => {
    return () => {
      if (toastRef.current) clearTimeout(toastRef.current)
    }
  }, [])

  // Poll job status for direct generation
  useEffect(() => {
    if (!directJobId) return
    let stopped = false

    const poll = async () => {
      while (!stopped) {
        await new Promise(r => setTimeout(r, 3000))
        try {
          const token = localStorage.getItem('jwt')
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/video/status/${directJobId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (!res.ok) continue
          const data = await res.json()
          setDirectProgress(data.progress ?? 0)
          setDirectMessage(data.message ?? '')
          if (data.status === 'DONE') {
            setDirectVideoUrl(data.outputUrl)
            setDirectProgress(100)
            setDirectMessage('Your video is ready!')
            loadVideos()
            stopped = true
          } else if (data.status === 'FAILED') {
            setError(data.message || 'Generation failed')
            setView('form')
            setDirectJobId(null)
            stopped = true
          }
        } catch { /* retry */ }
      }
    }

    poll()
    return () => { stopped = true }
  }, [directJobId, loadVideos])

  const handleDirectGenerate = async () => {
    if (topic.trim().length < 3) return
    setError(null)
    setDirectVideoUrl(null)
    setDirectProgress(0)
    setDirectMessage('Starting...')

    // Clamp duration: direct generation supports 2–30s
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
      // Only show generating view after successfully starting the job
      setView('generating')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start generation')
      setView('form')
    }
  }

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
    if (topic.trim().length < 3) return
    setError(null)
    setScriptReady(false)
    scriptResultRef.current = null
    setView('loading')

    try {
      const scriptResult = await video.generateScript({
        topic: topic.trim(),
        genre,
        aspectRatio,
        market,
        duration,
      })
      scriptResultRef.current = scriptResult
      setScriptReady(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Script generation failed. Please try again.')
      setView('form')
    }
  }

  const handleRegenerate = () => {
    setResult(null)
    setView('form')
  }

  const handleGenerateVideo = async () => {
    if (!result) return
    setError(null)
    setView('loading')
    try {
      const { jobId } = await video.generate({
        topic: topic.trim(),
        genre,
        aspectRatio,
        market,
        duration,
        pipeline,
      })
      setActiveJobId(jobId)
      setActivePipeline(pipeline)
      if (pipeline === 'free') {
        setView('loading')
      } else {
        setView('form')
        setResult(null)
        loadVideos()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video generation failed.')
      setView('result')
    }
  }

  const handleSaveDraft = (_draft: GenerationResult) => {
    setShowSuccessToast(true)
    toastRef.current = setTimeout(() => setShowSuccessToast(false), 4000)
  }

  const charCount = topic.length

  return (
    <>
      <BubbleCanvas visible={view === 'loading' || view === 'generating'} />

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-24 right-8 z-50 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-500 border border-green-400">
          <Sparkles className="animate-pulse" size={20} />
          <div>
            <p className="font-bold">Draft saved!</p>
            <p className="text-xs opacity-90">Your script has been saved.</p>
          </div>
        </div>
      )}

      {/* Direct generation progress overlay */}
      {view === 'generating' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-6 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-xl">
                <Sparkles size={32} className="text-white animate-pulse" />
              </div>
              <h2 className="text-xl font-black text-white">Generating Your Video</h2>
              <p className="text-zinc-400 text-sm">{directMessage || 'Please wait...'}</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${directProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{directProgress}%</span>
                <span>{directProgress < 30 ? 'Expanding prompt...' : directProgress < 90 ? 'AI generating video...' : 'Finalizing...'}</span>
              </div>
            </div>

            {/* Video ready */}
            {directVideoUrl && (
              <div className="space-y-4">
                <video
                  src={directVideoUrl}
                  controls
                  autoPlay
                  className="w-full rounded-xl border border-zinc-700"
                />
                <div className="flex gap-3">
                  <a
                    href={directVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all"
                  >
                    Download Video
                  </a>
                  <button
                    onClick={() => { setView('form'); setDirectJobId(null); setDirectVideoUrl(null) }}
                    className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition-all"
                  >
                    Generate Another
                  </button>
                </div>
              </div>
            )}

            {!directVideoUrl && (
              <p className="text-center text-xs text-zinc-600">
                This may take 1–5 minutes depending on video length
              </p>
            )}
          </div>
        </div>
      )}

      {/* Script loading overlay */}
      {view === 'loading' && (
        activeJobId && activePipeline === 'free' ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto w-full max-w-2xl px-6">
              <FreePipelineProgress
                jobId={activeJobId}
                userId={''}
                durationSec={duration}
                onComplete={(_outputUrl) => {
                  setView('form')
                  setResult(null)
                  setActiveJobId(null)
                  loadVideos()
                }}
                onError={(msg) => {
                  setError(msg)
                  setView('form')
                  setActiveJobId(null)
                }}
              />
            </div>
          </div>
        ) : (
          <NeuralLoader
            message="Gemini is crafting your script…"
            onComplete={scriptReady ? () => {
              setResult(scriptResultRef.current)
              setView('result')
            } : undefined}
            triggerComplete={scriptReady}
          />
        )
      )}

      {/* Result View */}
      {view === 'result' && result && (
        <div className="max-w-5xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <ResultPanel
            result={result}
            onRegenerate={handleRegenerate}
            onSaveDraft={handleSaveDraft}
            onGenerateVideo={handleGenerateVideo}
          />
        </div>
      )}

      {/* Form View */}
      {view !== 'result' && view !== 'generating' && (
        <div
          className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20"
          style={{
            opacity: view === 'loading' ? 0.2 : 1,
            pointerEvents: view === 'loading' ? 'none' : 'auto',
            transition: 'opacity 0.6s ease',
          }}
        >
          {/* ─── Header ─────────────────────────────── */}
          <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-8 md:p-12">
            <div className="absolute top-0 right-0 -m-8 w-72 h-72 bg-purple-600/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-0 left-0 -m-8 w-72 h-72 bg-cyan-500/10 blur-[120px] rounded-full" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest">
                  <Sparkles size={14} />
                  AI Script Engine — Hook & Loop Method
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                  Craft Your Script
                </h1>
                <p className="text-zinc-400 text-lg leading-relaxed">
                  Describe your idea, pick your format and style — Gemini builds your full script with hook, scenes, and loop. Then edit it before generating.
                </p>
              </div>
              <div className="shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-cyan-400 flex items-center justify-center shadow-xl shadow-purple-600/20">
                  <Sparkles size={40} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* ─── 1. Describe Your Idea ─────────────────── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Describe Your Idea</h2>
                <p className="text-xs text-zinc-500 mt-0.5">What is your video about? The more detail, the better the script.</p>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={topic}
                onChange={(e) => {
                  if (e.target.value.length <= 500) setTopic(e.target.value)
                }}
                placeholder="Ex: The mysterious story of the Hiroshima bomb — from the decision to drop it, to the survivors who rebuilt an entire city from ashes..."
                className="w-full h-36 bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition-all resize-none text-[15px] leading-relaxed"
                aria-label="Video idea description"
              />
              <div className="absolute bottom-4 right-4">
                <span
                  className={cn(
                    'text-xs font-mono transition-colors',
                    charCount < 3 ? 'text-red-400' : charCount > 450 ? 'text-yellow-400' : 'text-zinc-600'
                  )}
                >
                  {charCount}/500
                </span>
              </div>
            </div>
            {charCount > 0 && charCount < 3 && (
              <p className="text-xs text-red-400">Minimum 3 characters required</p>
            )}

            {/* Reference Image Upload */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Reference Image (Optional)
                <span className="text-xs text-zinc-500 ml-2">
                  Upload an image to guide the video generation
                </span>
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
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─── 2. Genre / Type ──────────────────────── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Video Genre</h2>
                <p className="text-xs text-zinc-500 mt-0.5">What type of video do you want to create?</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {GENRES.map((g) => {
                const Icon = g.icon
                const selected = genre === g.id
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGenre(g.id)}
                    className={cn(
                      'flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all text-center group',
                      selected
                        ? 'bg-purple-600/10 border-purple-500 shadow-lg shadow-purple-500/10'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    )}
                  >
                    <div className={cn(
                      'p-2.5 rounded-xl transition-colors',
                      selected ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200'
                    )}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className={cn('text-sm font-bold leading-tight', selected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200')}>
                        {g.label}
                      </p>
                      <p className="text-[10px] text-zinc-600 leading-tight mt-0.5">{g.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ─── 3. Aspect Ratio ─────────────────────── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Aspect Ratio</h2>
                <p className="text-xs text-zinc-500 mt-0.5">What format will your video be in?</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ASPECT_RATIOS.map((ar) => {
                const selected = aspectRatio === ar.id
                return (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setAspectRatio(ar.id)}
                    className={cn(
                      'flex flex-col items-center gap-4 p-5 rounded-2xl border transition-all group',
                      selected
                        ? 'bg-cyan-600/10 border-cyan-500 shadow-lg shadow-cyan-500/10'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    )}
                  >
                    {/* Shape preview */}
                    <div className="h-12 flex items-center justify-center">
                      <div
                        className={cn(
                          ar.shape,
                          'rounded transition-all border-2',
                          selected ? 'border-cyan-400 bg-cyan-400/10' : 'border-zinc-600 bg-zinc-800 group-hover:border-zinc-500'
                        )}
                      />
                    </div>
                    <div className="text-center">
                      <p className={cn('text-lg font-black font-mono', selected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200')}>
                        {ar.label}
                      </p>
                      <p className={cn('text-xs font-bold mt-0.5', selected ? 'text-cyan-400' : 'text-zinc-500')}>
                        {ar.desc}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{ar.subdesc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ─── 4. Target Language ──────────────────── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                4
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Script Language</h2>
                <p className="text-xs text-zinc-500 mt-0.5">The script will be written in this language</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {MARKETS.map((m) => {
                const selected = market === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMarket(m.id)}
                    className={cn(
                      'flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.02]',
                      selected
                        ? 'bg-pink-600/10 border-pink-500 text-white shadow-lg shadow-pink-500/10'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    )}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <span className="text-sm font-bold">{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ─── 5. Duration ─────────────────────────── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  5
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Duration</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">How long should the video be? (Max 10s for video generation)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-white font-mono">
                  {formatDuration(duration)}
                </span>
                <p className="text-xs text-zinc-500 mt-1">
                  ~{Math.round(duration * 130 / 60)} words
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="range"
                min={2}
                max={10}
                step={1}
                value={Math.min(duration, 10)}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500 duration-slider"
                aria-label="Video duration in seconds"
              />
              <div className="flex justify-between px-1">
                {[2, 3, 5, 7, 10].map((snap) => (
                  <button
                    key={snap}
                    type="button"
                    onClick={() => setDuration(snap)}
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider transition-colors px-1.5 py-0.5 rounded',
                      duration === snap
                        ? 'text-purple-400 bg-purple-500/10'
                        : 'text-zinc-600 hover:text-zinc-400'
                    )}
                  >
                    {formatDuration(snap)}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning banner */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-yellow-400 mt-0.5 shrink-0" />
              <div className="text-xs text-yellow-300">
                <p className="font-bold">Contrainte de durée:</p>
                <p className="text-yellow-400/80 mt-0.5">
                  La durée maximale pour la génération vidéo est de <span className="font-bold">10 secondes</span>. 
                  Pour des vidéos plus longues, générez plusieurs clips et assemblez-les.
                </p>
              </div>
            </div>
          </div>

          {/* ─── 6. Quality & FPS ─────────────────────── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                6
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Quality & FPS</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Choose video quality (max 1080p, 30fps, 10s)</p>
              </div>
            </div>
            
            {/* Quality Presets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {QUALITY_PRESETS.map((preset) => {
                const selected = quality === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setQuality(preset.id)
                      setCustomFps(null) // Reset custom FPS when selecting preset
                    }}
                    className={cn(
                      'flex flex-col gap-3 p-5 rounded-2xl border transition-all text-left group',
                      selected 
                        ? 'bg-emerald-600/10 border-emerald-500 shadow-lg shadow-emerald-500/10' 
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{preset.icon}</span>
                      <span className={cn(
                        'text-xs font-bold px-2 py-1 rounded-full',
                        selected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500 group-hover:text-zinc-400'
                      )}>
                        {preset.fps} FPS
                      </span>
                    </div>
                    <div>
                      <p className={cn('text-lg font-black', selected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200')}>
                        {preset.label}
                      </p>
                      <p className={cn('text-xs mt-1', selected ? 'text-emerald-400' : 'text-zinc-500')}>
                        {preset.desc}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-1">{preset.time}</p>
                    </div>
                    <div className="text-[10px] text-zinc-600 font-mono">
                      {preset.width}x{preset.height}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Custom FPS Control */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white">Custom FPS (Optional)</label>
                <span className="text-xs text-zinc-500">Max 30 FPS</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={15}
                  max={30}
                  step={5}
                  value={customFps ?? QUALITY_PRESETS.find(p => p.id === quality)?.fps ?? 25}
                  onChange={(e) => setCustomFps(Number(e.target.value))}
                  className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  aria-label="Custom FPS"
                />
                <span className="text-lg font-black text-white font-mono w-16 text-right">
                  {customFps ?? QUALITY_PRESETS.find(p => p.id === quality)?.fps ?? 25} FPS
                </span>
              </div>
              <div className="flex justify-between px-1">
                {[15, 20, 25, 30].map((fps) => (
                  <button
                    key={fps}
                    type="button"
                    onClick={() => setCustomFps(fps)}
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider transition-colors px-2 py-1 rounded',
                      (customFps ?? QUALITY_PRESETS.find(p => p.id === quality)?.fps) === fps 
                        ? 'text-emerald-400 bg-emerald-500/10' 
                        : 'text-zinc-600 hover:text-zinc-400'
                    )}
                  >
                    {fps}
                  </button>
                ))}
              </div>
              {customFps && (
                <button
                  onClick={() => setCustomFps(null)}
                  className="text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  Reset to preset FPS
                </button>
              )}
            </div>

            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-blue-400 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-300">
                <p className="font-bold mb-1">Constraints automatiques:</p>
                <ul className="space-y-0.5 text-blue-400/80">
                  <li>• Durée max: 10 secondes</li>
                  <li>• Résolution max: 1080p (1920x1080)</li>
                  <li>• FPS max: 30 fps</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ─── 7. Voice Test ──────────────────────── */}
          {/* Hidden: Voice Model Selection
          <VoiceTestPanel
            onVoiceSelected={(voiceId, voiceName) => {
              setSelectedVoiceId(voiceId)
              setSelectedVoiceName(voiceName)
            }}
            isLoading={view === 'loading'}
          />
          */}

          {/* ─── Pipeline Selector ───────────────────── */}
          {/* Hidden: Generation Mode Selection
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <PipelineSelector value={pipeline} onChange={setPipeline} />
          </div>
          */}

          {/* ─── Summary banner ──────────────────────── */}
          {topic.trim().length >= 3 && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="text-zinc-400">Summary:</span>
              <span className="text-white font-bold truncate max-w-[200px]">{topic.trim().slice(0, 60)}{topic.trim().length > 60 ? '…' : ''}</span>
              <span className="text-purple-400 font-bold">{genre}</span>
              <span className="text-cyan-400 font-bold font-mono">{aspectRatio}</span>
              <span className="text-pink-400 font-bold">{MARKETS.find(m => m.id === market)?.label}</span>
              <span className="text-yellow-400 font-bold">{formatDuration(duration)}</span>
              {selectedVoiceName && <span className="text-green-400 font-bold">🎤 {selectedVoiceName}</span>}
            </div>
          )}

          {/* ─── Error ──────────────────────────────── */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400 animate-in fade-in duration-300">
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* ─── Generate Buttons ──────────────────────── */}
          <div className="flex justify-center">
            {/* Direct Video Generation */}
            <button
              type="button"
              onClick={handleDirectGenerate}
              disabled={topic.trim().length < 3}
              className={cn(
                'group relative flex flex-col items-center justify-center gap-2 py-6 px-8 rounded-3xl font-black text-lg transition-all overflow-hidden max-w-md w-full',
                topic.trim().length < 3
                  ? 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 text-white hover:scale-[1.01] shadow-2xl shadow-cyan-600/30 hover:shadow-cyan-600/50'
              )}
              aria-label="Generate video directly"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={22} className={topic.trim().length >= 3 ? 'animate-pulse' : ''} />
                Generate Video Directly
              </div>
              <span className="text-xs font-normal opacity-75">
                AI expands your idea → generates video ({Math.min(Math.max(Math.round(duration), 2), 30)}s max)
              </span>
              {topic.trim().length >= 3 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              )}
            </button>

            {/* Hidden: Script First Button
            <button
              type="button"
              onClick={handleGenerate}
              disabled={topic.trim().length < 3}
              className={cn(
                'group relative flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-3xl font-black text-lg transition-all overflow-hidden',
                topic.trim().length < 3
                  ? 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'bg-zinc-900 border border-purple-500/50 text-white hover:scale-[1.01] hover:border-purple-400 shadow-lg'
              )}
              aria-label="Generate script first"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={22} />
                Generate Script First
              </div>
              <span className="text-xs font-normal opacity-75">
                Review &amp; edit script before generating video
              </span>
            </button>
            */}
          </div>

          {/* ─── Recent Videos ───────────────────────── */}
          <div className="space-y-4 pt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Generation History</h2>
              <div className="h-px flex-1 mx-6 bg-zinc-800" />
            </div>

            {videosLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <VideoCardSkeleton key={i} />)}
              </div>
            ) : recentVideos.length === 0 ? (
              <div className="text-center py-20 bg-zinc-950/50 rounded-3xl border border-dashed border-zinc-800 text-zinc-500 text-sm">
                No videos yet. Use the engine above to start generating!
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {recentVideos.map((v) => (
                  <VideoCard
                    key={v.id}
                    video={v}
                    onDownload={(v) => {
                      if (!v.outputUrl) return
                      const a = document.createElement('a')
                      a.href = v.outputUrl
                      a.download = `${v.inputPrompt || 'video'}.mp4`
                      a.target = '_blank'
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                    }}
                    onOpenEditor={(v) => {
                      if (v.outputUrl) {
                        sessionStorage.setItem('editor_source', JSON.stringify({
                          url: v.outputUrl,
                          title: v.inputPrompt || 'Generated Video',
                        }))
                      }
                      router.push('/dashboard/editor')
                    }}
                    onPublish={setPublishingVideo}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {publishingVideo && (
        <PublishModal
          video={publishingVideo}
          isOpen={!!publishingVideo}
          onClose={() => setPublishingVideo(null)}
          onPublished={() => {
            setPublishingVideo(null)
            loadVideos()
          }}
        />
      )}
    </>
  )
}
