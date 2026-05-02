'use client'

import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { cn } from '@/lib/utils'
import { useAssemblyProgress } from '@/hooks/useAssemblyProgress'
import { CheckCircle2, Loader2, Circle, AlertCircle, RefreshCw } from 'lucide-react'

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { key: 'SCRIPTING',   label: 'Writing script',          icon: '✍️',  pct: 5  },
  { key: 'SCENE_SPLIT', label: 'Splitting into scenes',    icon: '🎬',  pct: 15 },
  { key: 'VOICING',     label: 'Generating voiceover',     icon: '🎙️', pct: 25 },
  { key: 'GENERATING',  label: 'Generating AI clips',      icon: '✨',  pct: 70 },
  { key: 'RENDERING',   label: 'Assembling with FFmpeg',   icon: '⚙️', pct: 90 },
  { key: 'UPLOADING',   label: 'Uploading to cloud',       icon: '☁️', pct: 97 },
  { key: 'DONE',        label: 'Video ready',              icon: '✓',   pct: 100 },
] as const

type StepKey = typeof STEPS[number]['key']

// Map backend VideoStatus → step key
const STATUS_TO_STEP: Record<string, StepKey> = {
  SCRIPTING:  'SCRIPTING',
  VOICING:    'VOICING',
  GENERATING: 'GENERATING',
  RENDERING:  'RENDERING',
  DONE:       'DONE',
}

// Estimated assembly time by duration (minutes)
function estimateMinutes(durationSec: number): string {
  const min = durationSec / 60
  if (min <= 5)  return '3–4 min'
  if (min <= 15) return '8–10 min'
  if (min <= 30) return '15–20 min'
  return '30–40 min'
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface FreePipelineProgressProps {
  jobId: string
  userId: string
  durationSec: number
  onComplete: (outputUrl: string) => void
  onError: (message: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FreePipelineProgress({
  jobId,
  userId,
  durationSec,
  onComplete,
  onError,
}: FreePipelineProgressProps) {
  const [activeStep, setActiveStep] = useState<StepKey>('SCRIPTING')
  const [completedSteps, setCompletedSteps] = useState<Set<StepKey>>(new Set())
  const [message, setMessage] = useState('Starting...')
  const [overallPct, setOverallPct] = useState(0)
  const [failed, setFailed] = useState(false)
  const [failMessage, setFailMessage] = useState('')
  const [done, setDone] = useState(false)
  const [clipProgress, setClipProgress] = useState<{ current: number; total: number } | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const { progress: ffmpegPct } = useAssemblyProgress()

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001'
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null

    const socket = io(`${apiUrl}/video-progress`, {
      auth: { token },
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('subscribe', { videoGenerationId: jobId })
    })

    socket.on('progress', (data: {
      videoGenerationId: string
      status: string
      progress: number
      message: string
      outputUrl?: string
    }) => {
      if (data.videoGenerationId !== jobId) return

      const step = STATUS_TO_STEP[data.status] ?? activeStep
      setActiveStep(step)
      setMessage(data.message ?? '')
      setOverallPct(data.progress ?? 0)

      // Parse clip progress from message e.g. "Generating clip 3/8..."
      if (data.status === 'GENERATING') {
        const match = data.message?.match(/clip\s+(\d+)\/(\d+)/i)
        if (match) setClipProgress({ current: parseInt(match[1]), total: parseInt(match[2]) })
      }

      // Mark all steps before current as completed
      const stepIdx = STEPS.findIndex(s => s.key === step)
      setCompletedSteps(new Set(STEPS.slice(0, stepIdx).map(s => s.key)))

      if (data.status === 'DONE') {
        setCompletedSteps(new Set(STEPS.map(s => s.key)))
        setDone(true)
        if (data.outputUrl) onComplete(data.outputUrl)
      }

      if (data.status === 'FAILED') {
        setFailed(true)
        setFailMessage(data.message ?? 'Generation failed')
        onError(data.message ?? 'Generation failed')
      }
    })

    return () => { socket.disconnect() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  const activeIdx = STEPS.findIndex(s => s.key === activeStep)

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Free Pipeline · Local Assembly</p>
        <h2 className="text-2xl font-black text-white">
          {done ? '🎉 Video Ready!' : failed ? '❌ Generation Failed' : 'Generating Your Video'}
        </h2>
        {!done && !failed && (
          <p className="text-zinc-500 text-sm">Estimated time: {estimateMinutes(durationSec)}</p>
        )}
      </div>

      {/* Overall progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{message}</span>
          <span>{overallPct}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full transition-all duration-700"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* Steps list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl divide-y divide-zinc-800 overflow-hidden">
        {STEPS.map((step, idx) => {
          const isCompleted = completedSteps.has(step.key)
          const isActive = step.key === activeStep && !done && !failed
          const isPending = !isCompleted && !isActive

          return (
            <div key={step.key} className={cn(
              'flex items-start gap-4 px-5 py-4 transition-colors',
              isActive && 'bg-purple-500/5',
            )}>
              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                {isCompleted ? (
                  <CheckCircle2 size={18} className="text-green-400" />
                ) : isActive ? (
                  <Loader2 size={18} className="text-purple-400 animate-spin" />
                ) : (
                  <Circle size={18} className="text-zinc-700" />
                )}
              </div>

              {/* Label + message */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">{step.icon}</span>
                  <span className={cn(
                    'text-sm font-medium',
                    isCompleted ? 'text-zinc-400 line-through' : isActive ? 'text-white' : 'text-zinc-600'
                  )}>
                    {step.label}
                  </span>
                </div>

                {/* Active message */}
                {isActive && message && (
                  <p className="text-xs text-purple-300 mt-1 truncate">{message}</p>
                )}

                {/* Clip counter for GENERATING step */}
                {isActive && step.key === 'GENERATING' && clipProgress && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span>Clip {clipProgress.current} / {clipProgress.total} generated</span>
                      <span>~{Math.ceil((clipProgress.total - clipProgress.current) * 1.25)} min remaining</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden w-full">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${(clipProgress.current / clipProgress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-600">Visual continuity: using last frame as reference</p>
                  </div>
                )}

                {/* FFmpeg progress bar for RENDERING step */}
                {isActive && step.key === 'RENDERING' && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden w-full">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${ffmpegPct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500">FFmpeg: {ffmpegPct}% · Processing locally on your computer</p>
                  </div>
                )}
              </div>

              {/* Right status */}
              <div className="shrink-0 text-xs">
                {isCompleted && <span className="text-green-400 font-bold">Done</span>}
                {isActive && <span className="text-purple-400 font-bold animate-pulse">Running</span>}
                {isPending && <span className="text-zinc-700">{step.pct}%</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Done state */}
      {done && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center space-y-2 animate-in zoom-in-95 duration-500">
          <p className="text-4xl">🎉</p>
          <p className="text-white font-bold">Video assembled on your computer!</p>
          <p className="text-zinc-400 text-sm">Your video is ready in the library below.</p>
        </div>
      )}

      {/* Failed state */}
      {failed && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle size={18} />
            <span className="font-bold text-sm">Generation failed</span>
          </div>
          <p className="text-zinc-400 text-sm">{failMessage}</p>
          <button
            onClick={() => onError(failMessage)}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      )}
    </div>
  )
}
