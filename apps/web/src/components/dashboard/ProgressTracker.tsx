'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type VideoStatus = 'PENDING' | 'SCRIPTING' | 'VOICING' | 'GENERATING' | 'RENDERING' | 'DONE' | 'FAILED'

interface ProgressEvent {
  videoGenerationId: string
  status: VideoStatus
  progress: number
  message: string
  outputUrl?: string
}

interface Step {
  status: VideoStatus
  label: string
  progressValue: number
}

const STEPS: Step[] = [
  { status: 'SCRIPTING', label: 'Script Written', progressValue: 10 },
  { status: 'VOICING', label: 'Generating Voice', progressValue: 25 },
  { status: 'GENERATING', label: 'Creating Video Clips', progressValue: 50 },
  { status: 'RENDERING', label: 'Rendering Final Video', progressValue: 75 },
  { status: 'DONE', label: 'Ready', progressValue: 100 },
]

const STATUS_ORDER: VideoStatus[] = ['SCRIPTING', 'VOICING', 'GENERATING', 'RENDERING', 'DONE']

function getStepState(step: Step, currentStatus: VideoStatus): 'completed' | 'active' | 'pending' {
  if (currentStatus === 'FAILED') return 'pending'
  const currentIdx = STATUS_ORDER.indexOf(currentStatus)
  const stepIdx = STATUS_ORDER.indexOf(step.status)
  if (currentIdx > stepIdx) return 'completed'
  if (currentIdx === stepIdx) return 'active'
  return 'pending'
}

interface Props {
  jobId: string
  userId: string
  onComplete: (outputUrl: string) => void
  onRetry: () => void
}

export default function ProgressTracker({ jobId, userId, onComplete, onRetry }: Props) {
  const [currentStatus, setCurrentStatus] = useState<VideoStatus>('PENDING')
  const [currentProgress, setCurrentProgress] = useState(0)
  const [currentMessage, setCurrentMessage] = useState('Queued...')
  const [isFailed, setIsFailed] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    const socketUrl = apiUrl.replace('/api', '')
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null

    const socket = io(`${socketUrl}/video-progress`, {
      auth: { token },
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on('video:progress', (event: ProgressEvent) => {
      if (event.videoGenerationId !== jobId) return

      setCurrentStatus(event.status)
      setCurrentProgress(event.progress)
      setCurrentMessage(event.message)

      if (event.status === 'DONE' && event.outputUrl) {
        setTimeout(() => onComplete(event.outputUrl!), 3000)
      }
      if (event.status === 'FAILED') {
        setIsFailed(true)
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [jobId, onComplete])

  const estimatedMinutesRemaining = (() => {
    const activeIdx = STATUS_ORDER.indexOf(currentStatus)
    if (activeIdx < 0 || currentStatus === 'DONE') return 0
    return (STATUS_ORDER.length - 1 - activeIdx) * 2
  })()

  const handleRetry = () => {
    onRetry()
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-8 space-y-8 w-full max-w-lg shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Generating YouTube Video</h3>
          <p className="text-zinc-400 text-sm mt-1">ID: {jobId.slice(0, 8)}...</p>
        </div>
        {currentStatus !== 'DONE' && !isFailed && (
          <div className="text-right">
            <span className="text-2xl font-bold text-purple-500">{currentProgress}%</span>
            {estimatedMinutesRemaining > 0 && (
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">~{estimatedMinutesRemaining} min left</p>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar Container */}
      <div className="relative h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute inset-y-0 left-0 transition-all duration-1000 ease-out',
            isFailed ? 'bg-red-500' : 'bg-gradient-to-r from-purple-600 to-indigo-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
          )}
          style={{ width: `${currentProgress}%` }}
        />
      </div>

      {/* Steps List */}
      <div className="relative space-y-6">
        {/* Connecting Line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-zinc-800" />

        {STEPS.map((step, i) => {
          const state = getStepState(step, currentStatus)
          
          return (
            <div key={step.status} className="relative flex items-start gap-4">
              <div className="relative z-10 mt-1">
                {state === 'completed' ? (
                  <div className="bg-green-500 rounded-full p-0.5">
                    <CheckCircle2 size={16} className="text-zinc-950" />
                  </div>
                ) : state === 'active' ? (
                  <div className="bg-purple-500 rounded-full p-0.5 animate-pulse">
                    <Loader2 size={16} className="text-zinc-950 animate-spin" />
                  </div>
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full border-2 border-zinc-800 bg-zinc-900" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-sm font-medium transition-colors duration-300",
                    state === 'completed' ? "text-zinc-500" : state === 'active' ? "text-white" : "text-zinc-600"
                  )}>
                    {step.label}
                  </span>
                  {state === 'active' && (
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded uppercase tracking-tighter">
                      In Progress
                    </span>
                  )}
                </div>
                {state === 'active' && (
                  <p className="text-xs text-zinc-400 mt-1 animate-in fade-in slide-in-from-left-2">
                    {currentMessage}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer States */}
      {currentStatus === 'DONE' && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 animate-bounce">
          <div className="bg-green-500 rounded-full p-1">
            <CheckCircle2 size={20} className="text-zinc-950" />
          </div>
          <div>
            <p className="text-green-400 font-bold text-sm">Success!</p>
            <p className="text-green-500/70 text-xs">Your video is ready for download.</p>
          </div>
        </div>
      )}

      {isFailed && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <XCircle size={24} className="text-red-500" />
            <p className="text-red-400 font-medium">Generation failed</p>
          </div>
          <button
            onClick={handleRetry}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-all transform active:scale-95 shadow-lg shadow-red-600/20"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
