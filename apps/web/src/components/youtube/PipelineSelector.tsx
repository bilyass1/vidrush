'use client'

import { useEffect, useState } from 'react'
import { tauriCommands } from '@/lib/tauri'
import { cn } from '@/lib/utils'

interface PipelineSelectorProps {
  value: 'free' | 'premium'
  onChange: (v: 'free' | 'premium') => void
}

export default function PipelineSelector({ value, onChange }: PipelineSelectorProps) {
  const [ffmpegReady, setFfmpegReady] = useState<boolean | null>(null)

  useEffect(() => {
    tauriCommands.checkFfmpeg()
      .then(setFfmpegReady)
      .catch(() => setFfmpegReady(false))
  }, [])

  const freeDisabled = ffmpegReady === false

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Generation Mode</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Free card */}
        <button
          type="button"
          disabled={freeDisabled}
          onClick={() => !freeDisabled && onChange('free')}
          className={cn(
            'relative text-left p-5 rounded-2xl border-[1.5px] transition-all',
            freeDisabled
              ? 'opacity-50 cursor-not-allowed border-zinc-800 bg-zinc-950'
              : value === 'free'
                ? 'border-[#7F77DD] bg-[#7F77DD]/8 shadow-lg shadow-[#7F77DD]/10'
                : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
          )}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">⚡ Free</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/20">
                  $0
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">LTX 2.3 + Google TTS</p>
            </div>
            <div className={cn(
              'w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 transition-colors',
              value === 'free' && !freeDisabled
                ? 'border-[#7F77DD] bg-[#7F77DD]'
                : 'border-zinc-600'
            )} />
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed mb-3">
            LTX 2.3 + Google TTS + FFmpeg<br />
            AI-generated video · Runs on your server
          </p>

          {/* FFmpeg status */}
          <div className="flex items-center gap-1.5">
            {ffmpegReady === null ? (
              <span className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse" />
            ) : ffmpegReady ? (
              <span className="w-2 h-2 rounded-full bg-green-400" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-red-400" />
            )}
            <span className={cn(
              'text-[10px] font-medium',
              ffmpegReady === null ? 'text-zinc-600' :
              ffmpegReady ? 'text-green-400' : 'text-red-400'
            )}>
              {ffmpegReady === null ? 'Checking FFmpeg...' :
               ffmpegReady ? 'FFmpeg ready' : 'FFmpeg not found'}
            </span>
            {ffmpegReady === false && (
              <a
                href="https://ffmpeg.org/download.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-purple-400 hover:underline ml-1"
                onClick={e => e.stopPropagation()}
              >
                Install →
              </a>
            )}
          </div>
        </button>

        {/* Premium card */}
        <button
          type="button"
          onClick={() => onChange('premium')}
          className={cn(
            'relative text-left p-5 rounded-2xl border-[1.5px] transition-all',
            value === 'premium'
              ? 'border-[#7F77DD] bg-[#7F77DD]/8 shadow-lg shadow-[#7F77DD]/10'
              : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
          )}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">✨ Premium</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20">
                  ~$0.10
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">ElevenLabs Neural</p>
            </div>
            <div className={cn(
              'w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 transition-colors',
              value === 'premium'
                ? 'border-[#7F77DD] bg-[#7F77DD]'
                : 'border-zinc-600'
            )} />
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed mb-3">
            LTX 2.3 + ElevenLabs Neural<br />
            Professional voice · Cloud rendered
          </p>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-[10px] font-medium text-purple-400">Always available</span>
          </div>
        </button>

      </div>
    </div>
  )
}
