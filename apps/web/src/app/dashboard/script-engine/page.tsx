'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles, AlertCircle, FileText, Skull, Search, GraduationCap,
  Laugh, Landmark, Ghost, FlaskConical, Newspaper, Flame,
  Monitor, Smartphone, Square, ChevronLeft, Play, Pause,
  Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Wand2,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { scriptEngine, video, type ScriptResult, type ScriptScene } from '@/lib/api'
import { cn } from '@/lib/utils'

// ─── Constants ──────────────────────────────────────────────────────────────

const GENRES = [
  { id: 'Documentary',  label: 'Documentary',  desc: 'Fact-based storytelling',  icon: FileText },
  { id: 'Dark History', label: 'Dark History',  desc: 'Mysterious past events',   icon: Skull },
  { id: 'True Crime',   label: 'True Crime',    desc: 'Real investigations',       icon: Search },
  { id: 'Educational',  label: 'Educational',   desc: 'Learning & growth',         icon: GraduationCap },
  { id: 'Funny',        label: 'Funny',         desc: 'Comedy & entertainment',    icon: Laugh },
  { id: 'History',      label: 'History',       desc: 'Epic historical stories',   icon: Landmark },
  { id: 'Horror',       label: 'Horror',        desc: 'Scary & unsettling',        icon: Ghost },
  { id: 'Science',      label: 'Science',       desc: 'Mind-blowing discoveries',  icon: FlaskConical },
  { id: 'News',         label: 'News',          desc: 'Breaking & current events', icon: Newspaper },
  { id: 'Motivation',   label: 'Motivation',    desc: 'Inspiring & uplifting',     icon: Flame },
] as const

const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9', desc: 'YouTube / Landscape', shape: 'w-14 h-8',  icon: Monitor },
  { id: '9:16', label: '9:16', desc: 'Shorts / TikTok',     shape: 'w-6 h-10',  icon: Smartphone },
  { id: '1:1',  label: '1:1',  desc: 'Instagram Square',    shape: 'w-9 h-9',   icon: Square },
] as const

const LANGUAGES = [
  { id: 'en-us', label: 'US English', flag: '🇺🇸' },
  { id: 'en-uk', label: 'UK English', flag: '🇬🇧' },
  { id: 'fr',    label: 'French',     flag: '🇫🇷' },
  { id: 'ar',    label: 'Arabic',     flag: '🇸🇦' },
] as const

const QUALITY_PRESETS = [
  { id: 'low', label: 'Low (360p)', width: 640, height: 360, fps: 15, desc: 'Fast preview', time: '~1-2 min', icon: '⚡' },
  { id: 'medium', label: 'Medium (720p)', width: 1280, height: 720, fps: 25, desc: 'Social media', time: '~3-5 min', icon: '⭐' },
  { id: 'high', label: 'High (1080p)', width: 1920, height: 1080, fps: 30, desc: 'Professional', time: '~8-12 min', icon: '🎬' },
] as const

const SNAP_POINTS = [8, 15, 30, 60, 180, 300, 600, 900, 1200, 1600, 2400]

function formatDuration(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60), r = s % 60
  return r === 0 ? `${m}min` : `${m}min ${r}s`
}

function snapDuration(val: number): number {
  const closest = SNAP_POINTS.reduce((p, c) => Math.abs(c - val) < Math.abs(p - val) ? c : p)
  return Math.abs(closest - val) < 8 ? closest : val
}

// ─── Voice card types ────────────────────────────────────────────────────────

interface Voice {
  voice_id: string
  name: string
  labels?: { language?: string; gender?: string; accent?: string }
  preview_url?: string
}

// ─── Step badge ──────────────────────────────────────────────────────────────

function StepBadge({ n }: { n: number }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
      {n}
    </div>
  )
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-[#1e1e2e] border border-white/10 rounded-2xl p-8 space-y-6', className)}>
      {children}
    </div>
  )
}

// ─── Scene editor card ───────────────────────────────────────────────────────

function SceneCard({
  scene,
  index,
  total,
  onChange,
  onDelete,
  onMove,
}: {
  scene: ScriptScene
  index: number
  total: number
  onChange: (s: ScriptScene) => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="bg-zinc-950 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <GripVertical size={16} className="text-zinc-600 cursor-grab" />
        <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Scene {scene.scene_number}</span>
        <span className="text-xs text-zinc-600 ml-auto">{scene.duration_seconds}s</span>
        <button onClick={() => onMove(-1)} disabled={index === 0} className="p-1 text-zinc-600 hover:text-zinc-300 disabled:opacity-30">
          <ChevronUp size={14} />
        </button>
        <button onClick={() => onMove(1)} disabled={index === total - 1} className="p-1 text-zinc-600 hover:text-zinc-300 disabled:opacity-30">
          <ChevronDown size={14} />
        </button>
        <button onClick={() => setExpanded(e => !e)} className="p-1 text-zinc-600 hover:text-zinc-300">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button onClick={onDelete} className="p-1 text-zinc-600 hover:text-red-400">
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Narration</label>
            <textarea
              value={scene.narration}
              onChange={e => onChange({ ...scene, narration: e.target.value })}
              rows={3}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-purple-600/50"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Positive Prompt</label>
            <textarea
              value={scene.positive_prompt}
              onChange={e => onChange({ ...scene, positive_prompt: e.target.value })}
              rows={2}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-green-300 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-green-600/50"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Negative Prompt</label>
            <textarea
              value={scene.negative_prompt}
              onChange={e => onChange({ ...scene, negative_prompt: e.target.value })}
              rows={2}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-red-300 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-red-600/50"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Duration (seconds)</label>
            <input
              type="number"
              min={2}
              max={120}
              value={scene.duration_seconds}
              onChange={e => onChange({ ...scene, duration_seconds: Number(e.target.value) })}
              className="w-24 bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-600/50"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Script Review Panel ─────────────────────────────────────────────────────

function ScriptReviewPanel({
  script,
  onGenerate,
  onBack,
  isGenerating,
}: {
  script: ScriptResult
  onGenerate: (s: ScriptResult) => void
  onBack: () => void
  isGenerating: boolean
}) {
  const [scenes, setScenes] = useState<ScriptScene[]>(script.scenes)
  const [hook, setHook] = useState(script.hook)
  const [loopEnding, setLoopEnding] = useState(script.loop_ending)

  const totalDuration = scenes.reduce((s, sc) => s + sc.duration_seconds, 0)

  const updateScene = (i: number, s: ScriptScene) => {
    setScenes(prev => prev.map((sc, idx) => idx === i ? s : sc))
  }

  const deleteScene = (i: number) => {
    setScenes(prev => prev.filter((_, idx) => idx !== i).map((sc, idx) => ({ ...sc, scene_number: idx + 1 })))
  }

  const moveScene = (i: number, dir: -1 | 1) => {
    setScenes(prev => {
      const next = [...prev]
      const j = i + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next.map((sc, idx) => ({ ...sc, scene_number: idx + 1 }))
    })
  }

  const addScene = () => {
    setScenes(prev => [
      ...prev,
      {
        scene_number: prev.length + 1,
        narration: 'New scene narration...',
        duration_seconds: 10,
        positive_prompt: 'cinematic scene, photorealistic, 4K',
        negative_prompt: 'blur, noise, cartoon, watermark',
      },
    ])
  }

  const handleGenerate = () => {
    onGenerate({ ...script, hook, scenes, loop_ending: loopEnding })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">{script.title}</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {scenes.length} scenes · ~{formatDuration(totalDuration)} · ~{script.total_words} words
          </p>
        </div>
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={16} /> Back
        </button>
      </div>

      {/* Hook */}
      <Section>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Hook</span>
        </div>
        <input
          value={hook}
          onChange={e => setHook(e.target.value)}
          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600/50"
        />
      </Section>

      {/* Scenes */}
      <Section>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white">Scenes</span>
          <button
            onClick={addScene}
            className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Plus size={14} /> Add Scene
          </button>
        </div>
        <div className="space-y-3">
          {scenes.map((scene, i) => (
            <SceneCard
              key={i}
              scene={scene}
              index={i}
              total={scenes.length}
              onChange={s => updateScene(i, s)}
              onDelete={() => deleteScene(i)}
              onMove={dir => moveScene(i, dir)}
            />
          ))}
        </div>
      </Section>

      {/* Loop ending */}
      <Section>
        <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Loop Ending</span>
        <textarea
          value={loopEnding}
          onChange={e => setLoopEnding(e.target.value)}
          rows={2}
          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-600/50"
        />
      </Section>

      <button
        onClick={handleGenerate}
        disabled={isGenerating || scenes.length === 0}
        className={cn(
          'w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-lg transition-all',
          isGenerating || scenes.length === 0
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:scale-[1.01] shadow-2xl shadow-purple-600/30'
        )}
      >
        <Wand2 size={22} />
        {isGenerating ? 'Generating Video...' : 'Generate Video from Script'}
      </button>
    </div>
  )
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function ScriptEnginePage() {
  useAuth()
  const router = useRouter()

  // Form state
  const [idea, setIdea] = useState('')
  const [genre, setGenre] = useState('Documentary')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [language, setLanguage] = useState('en-us')
  const [duration, setDuration] = useState(60)
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [customFps, setCustomFps] = useState<number | null>(null)
  const [voiceId, setVoiceId] = useState<string | null>(null)
  const [voiceName, setVoiceName] = useState<string | null>(null)
  const [generationMode, setGenerationMode] = useState<'free' | 'premium'>('free')

  // View state
  const [view, setView] = useState<'form' | 'loading' | 'review' | 'generating'>('form')
  const [error, setError] = useState<string | null>(null)
  const [script, setScript] = useState<ScriptResult | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const charCount = idea.length

  // Poll job status when generating video directly
  useEffect(() => {
    if (!jobId || view !== 'generating') return
    let stopped = false

    const poll = async () => {
      while (!stopped) {
        await new Promise(r => setTimeout(r, 3000))
        try {
          const status = await scriptEngine.getStatus(jobId)
          if (status.status === 'DONE' && status.videoJobId) {
            setVideoUrl(status.videoJobId)
            setProgress(100)
            setProgressMsg('Your video is ready!')
            stopped = true
          } else if (status.status === 'FAILED') {
            setError('Generation failed')
            setView('form')
            stopped = true
          } else if (status.status === 'GENERATING') {
            setProgress(60)
            setProgressMsg('LTX génère la vidéo avec les prompts AI...')
          }
        } catch { /* retry */ }
      }
    }

    poll()
    return () => { stopped = true }
  }, [jobId, view])

  const handleGenerateScript = async () => {
    if (idea.trim().length < 3) return
    setError(null)
    setView('loading')
    setProgressMsg('Gemini is crafting your script...')

    try {
      const result = await scriptEngine.generateScript({
        idea: idea.trim(),
        genre,
        aspectRatio,
        language,
        durationSeconds: duration,
        voiceId: voiceId ?? undefined,
        generationMode,
      })
      setScript(result)
      setView('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Script generation failed')
      setView('form')
    }
  }

  const handleGenerateDirectly = async () => {
    if (idea.trim().length < 3) return
    setError(null)
    setView('generating')
    setProgress(10)
    setProgressMsg('Gemini développe votre idée...')

    try {
      const result = await scriptEngine.generateVideo({
        idea: idea.trim(),
        genre,
        aspectRatio,
        language,
        durationSeconds: Math.min(duration, 30), // Direct mode: max 30s
        voiceId: voiceId ?? undefined,
        generationMode,
      })
      setJobId(result.jobId)
      setProgress(20)
      setProgressMsg('Gemini crée le script avec prompts LTX...')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
      setView('form')
    }
  }

  const handleGenerateFromScript = async (editedScript: ScriptResult) => {
    setView('generating')
    setProgress(50)
    setProgressMsg('Generating video from your script...')
    // TODO: implement video generation from edited script
    // For now, just show a placeholder
    setTimeout(() => {
      setProgress(100)
      setProgressMsg('Video generation from edited script not yet implemented')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </button>

        {/* Loading overlay */}
        {view === 'loading' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md mx-6 bg-[#1e1e2e] border border-white/10 rounded-3xl p-8 space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-xl">
                  <Sparkles size={32} className="text-white animate-pulse" />
                </div>
                <h2 className="text-xl font-black text-white">Generating Script</h2>
                <p className="text-zinc-400 text-sm">{progressMsg}</p>
              </div>
              <div className="w-12 h-12 mx-auto border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          </div>
        )}

        {/* Generating video overlay */}
        {view === 'generating' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg mx-6 bg-[#1e1e2e] border border-white/10 rounded-3xl p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-xl">
                  <Sparkles size={32} className="text-white animate-pulse" />
                </div>
                <h2 className="text-xl font-black text-white">Generating Your Video</h2>
                <p className="text-zinc-400 text-sm">{progressMsg}</p>
              </div>

              <div className="space-y-2">
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{progress}%</span>
                  <span>{progress < 30 ? 'Gemini développe le script...' : progress < 90 ? 'LTX génère la vidéo...' : 'Finalisation...'}</span>
                </div>
              </div>

              {videoUrl && (
                <div className="space-y-4">
                  <video src={videoUrl} controls autoPlay className="w-full rounded-xl border border-zinc-700" />
                  <div className="flex gap-3">
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all"
                    >
                      Download Video
                    </a>
                    <button
                      onClick={() => { setView('form'); setJobId(null); setVideoUrl(null) }}
                      className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition-all"
                    >
                      Generate Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Review view */}
        {view === 'review' && script && (
          <ScriptReviewPanel
            script={script}
            onGenerate={handleGenerateFromScript}
            onBack={() => setView('form')}
            isGenerating={false}
          />
        )}

        {/* Form view */}
        {view === 'form' && (
          <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-[#1e1e2e] border border-white/10 p-8 md:p-12">
              <div className="absolute top-0 right-0 -m-8 w-72 h-72 bg-purple-600/10 blur-[120px] rounded-full" />
              <div className="absolute bottom-0 left-0 -m-8 w-72 h-72 bg-cyan-500/10 blur-[120px] rounded-full" />
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest">
                  <Sparkles size={14} />
                  AI Script Engine — Gemini Powered
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                  Craft Your Script
                </h1>
                <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
                  Describe your idea, pick your format — Gemini builds your full script with hook, scenes, and loop. Review and edit before generating.
                </p>
              </div>
            </div>

            {/* Step 1: Describe Your Idea */}
            <Section>
              <div className="flex items-center gap-4">
                <StepBadge n={1} />
                <div>
                  <h2 className="text-xl font-bold text-white">Describe Your Idea</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">What is your video about?</p>
                </div>
              </div>
              <div className="relative">
                <textarea
                  value={idea}
                  onChange={(e) => { if (e.target.value.length <= 500) setIdea(e.target.value) }}
                  placeholder="Ex: The mysterious story of the Hiroshima bomb — from the decision to drop it, to the survivors who rebuilt an entire city from ashes..."
                  className="w-full h-36 bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition-all resize-none text-[15px] leading-relaxed"
                />
                <div className="absolute bottom-4 right-4">
                  <span className={cn('text-xs font-mono transition-colors', charCount < 3 ? 'text-red-400' : charCount > 480 ? 'text-yellow-400' : 'text-zinc-600')}>
                    {charCount}/500
                  </span>
                </div>
              </div>
            </Section>

            {/* Step 2: Genre */}
            <Section>
              <div className="flex items-center gap-4">
                <StepBadge n={2} />
                <div>
                  <h2 className="text-xl font-bold text-white">Video Genre</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">What type of video?</p>
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
                        'flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all',
                        selected ? 'bg-purple-600/20 border-purple-500' : 'bg-zinc-950 border-white/10 hover:border-white/20'
                      )}
                    >
                      <div className={cn('p-2.5 rounded-xl', selected ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-400')}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className={cn('text-sm font-bold', selected ? 'text-white' : 'text-zinc-400')}>{g.label}</p>
                        <p className="text-[10px] text-zinc-600">{g.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </Section>

            {/* Step 3: Aspect Ratio */}
            <Section>
              <div className="flex items-center gap-4">
                <StepBadge n={3} />
                <div>
                  <h2 className="text-xl font-bold text-white">Aspect Ratio</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">What format?</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {ASPECT_RATIOS.map((ar) => {
                  const selected = aspectRatio === ar.id
                  return (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => setAspectRatio(ar.id)}
                      className={cn(
                        'flex flex-col items-center gap-4 p-5 rounded-2xl border transition-all',
                        selected ? 'bg-cyan-600/20 border-cyan-500' : 'bg-zinc-950 border-white/10 hover:border-white/20'
                      )}
                    >
                      <div className="h-12 flex items-center justify-center">
                        <div className={cn(ar.shape, 'rounded border-2', selected ? 'border-cyan-400 bg-cyan-400/10' : 'border-zinc-600 bg-zinc-800')} />
                      </div>
                      <div className="text-center">
                        <p className={cn('text-lg font-black font-mono', selected ? 'text-white' : 'text-zinc-400')}>{ar.label}</p>
                        <p className={cn('text-xs font-bold mt-0.5', selected ? 'text-cyan-400' : 'text-zinc-500')}>{ar.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </Section>

            {/* Step 4: Language */}
            <Section>
              <div className="flex items-center gap-4">
                <StepBadge n={4} />
                <div>
                  <h2 className="text-xl font-bold text-white">Script Language</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Language for the script</p>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {LANGUAGES.map((m) => {
                  const selected = language === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setLanguage(m.id)}
                      className={cn(
                        'flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all',
                        selected ? 'bg-pink-600/20 border-pink-500 text-white' : 'bg-zinc-950 border-white/10 text-zinc-500 hover:border-white/20'
                      )}
                    >
                      <span className="text-2xl">{m.flag}</span>
                      <span className="text-sm font-bold">{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </Section>

            {/* Step 5: Duration */}
            <Section>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <StepBadge n={5} />
                  <div>
                    <h2 className="text-xl font-bold text-white">Duration</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">How long?</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-white font-mono">{formatDuration(duration)}</span>
                  <p className="text-xs text-zinc-500 mt-1">~{Math.round(duration * 130 / 60)} words</p>
                </div>
              </div>
              <div className="space-y-3">
                <input
                  type="range"
                  min={8}
                  max={2400}
                  step={1}
                  value={duration}
                  onChange={(e) => setDuration(snapDuration(Number(e.target.value)))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between px-1">
                  {[8, 60, 300, 600, 1200, 2400].map((snap) => (
                    <button
                      key={snap}
                      type="button"
                      onClick={() => setDuration(snap)}
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wider transition-colors px-1.5 py-0.5 rounded',
                        duration === snap ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-600 hover:text-zinc-400'
                      )}
                    >
                      {formatDuration(snap)}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            {/* Step 6: Quality & FPS */}
            <Section>
              <div className="flex items-center gap-4">
                <StepBadge n={6} />
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
                        'flex flex-col gap-3 p-5 rounded-2xl border transition-all text-left',
                        selected ? 'bg-emerald-600/20 border-emerald-500' : 'bg-zinc-950 border-white/10 hover:border-white/20'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{preset.icon}</span>
                        <span className={cn('text-xs font-bold px-2 py-1 rounded-full', selected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500')}>
                          {preset.fps} FPS
                        </span>
                      </div>
                      <div>
                        <p className={cn('text-lg font-black', selected ? 'text-white' : 'text-zinc-400')}>{preset.label}</p>
                        <p className={cn('text-xs mt-1', selected ? 'text-emerald-400' : 'text-zinc-500')}>{preset.desc}</p>
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
              <div className="bg-zinc-950 border border-white/10 rounded-xl p-4 space-y-3">
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
            </Section>

            {/* Step 7: Voice (optional) */}
            <div className="bg-[#1e1e2e] border border-white/10 rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-4">
                <StepBadge n={7} />
                <div>
                  <h2 className="text-xl font-bold text-white">Voice Model (Optional)</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Pick a voice for future TTS generation</p>
                </div>
              </div>
              {voiceName && (
                <div className="bg-green-600/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-green-400 text-sm">✓ Selected: {voiceName}</span>
                  <button onClick={() => { setVoiceId(null); setVoiceName(null) }} className="ml-auto text-xs text-zinc-500 hover:text-white">
                    Clear
                  </button>
                </div>
              )}
              <p className="text-xs text-zinc-600">Voice selection is saved for later — video generation uses the script only for now.</p>
            </div>

            {/* Generation Mode - HIDDEN */}
            {false && (
            <Section>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-lg font-bold text-white">Generation Mode</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setGenerationMode('free')}
                  className={cn(
                    'p-5 rounded-2xl border transition-all text-left',
                    generationMode === 'free' ? 'bg-blue-600/20 border-blue-500' : 'bg-zinc-950 border-white/10 hover:border-white/20'
                  )}
                >
                  <p className={cn('font-bold text-lg', generationMode === 'free' ? 'text-white' : 'text-zinc-400')}>Free ($0)</p>
                  <p className="text-xs text-zinc-500 mt-1">LTX 2.3 + Google TTS + FFmpeg</p>
                </button>
                <button
                  type="button"
                  onClick={() => setGenerationMode('premium')}
                  className={cn(
                    'p-5 rounded-2xl border transition-all text-left',
                    generationMode === 'premium' ? 'bg-purple-600/20 border-purple-500' : 'bg-zinc-950 border-white/10 hover:border-white/20'
                  )}
                >
                  <p className={cn('font-bold text-lg', generationMode === 'premium' ? 'text-white' : 'text-zinc-400')}>Premium (~$0.10)</p>
                  <p className="text-xs text-zinc-500 mt-1">LTX 2.3 + ElevenLabs Neural</p>
                </button>
              </div>
            </Section>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400">
                <AlertCircle size={20} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-4">
              <button
                type="button"
                onClick={handleGenerateDirectly}
                disabled={idea.trim().length < 3}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-3xl font-black text-lg transition-all',
                  idea.trim().length < 3
                    ? 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 text-white hover:scale-[1.01] shadow-2xl shadow-cyan-600/30'
                )}
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={22} />
                  Generate Video Directly
                </div>
                <span className="text-xs font-normal opacity-75">Gemini développe l'idée → génère vidéo (30s max)</span>
              </button>

              {false && (
              <button
                type="button"
                onClick={handleGenerateScript}
                disabled={idea.trim().length < 3}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-3xl font-black text-lg transition-all',
                  idea.trim().length < 3
                    ? 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-[1.01] shadow-2xl shadow-purple-600/30'
                )}
              >
                <div className="flex items-center gap-2">
                  <FileText size={22} />
                  Generate Script First
                </div>
                <span className="text-xs font-normal opacity-75">Revoyez et éditez le script avant génération</span>
              </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
