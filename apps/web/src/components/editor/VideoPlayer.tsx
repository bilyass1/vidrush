'use client'

import { useRef, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  Rewind,
  FastForward,
  Volume2,
} from 'lucide-react'
import { assetUrl } from '@/lib/tauri'

interface VideoPlayerProps {
  videoPath: string
  currentTime: number
  isPlaying: boolean
  volume: number
  speed: number
  onTimeUpdate: (seconds: number) => void
  onDurationLoad?: (seconds: number) => void
  onPlay: () => void
  onPause: () => void
  onSeek: (seconds: number) => void
  onVolumeChange: (volume: number) => void
  onSpeedChange: (speed: number) => void
  onMarkCutStart?: () => void
  onMarkCutEnd?: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function VideoPlayer({
  videoPath,
  currentTime,
  isPlaying,
  volume,
  speed,
  onTimeUpdate,
  onDurationLoad,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onSpeedChange,
  onMarkCutStart,
  onMarkCutEnd,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isSeeking = useRef(false)
  const durationRef = useRef(0)

  // Sync play/pause state
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying && video.paused) {
      video.play().catch(() => {})
    } else if (!isPlaying && !video.paused) {
      video.pause()
    }
  }, [isPlaying])

  // Sync volume
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = Math.min(volume, 1.0)
    // For volume > 1.0, we'd need Web Audio API — keep simple for now
  }, [volume])

  // Sync speed
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = speed
  }, [speed])

  // Sync seek from external (e.g., timeline click)
  useEffect(() => {
    const video = videoRef.current
    if (!video || isSeeking.current) return
    if (Math.abs(video.currentTime - currentTime) > 0.3) {
      video.currentTime = currentTime
    }
  }, [currentTime])

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video || isSeeking.current) return
    onTimeUpdate(video.currentTime)
  }, [onTimeUpdate])

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    durationRef.current = video.duration
    onDurationLoad?.(video.duration)
  }, [onDurationLoad])

  const handleEnded = useCallback(() => {
    onPause()
  }, [onPause])

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (isPlaying) { onPause() } else { onPlay() }
          break
        case 'ArrowLeft':
          e.preventDefault()
          onSeek(Math.max(0, currentTime - 5))
          break
        case 'ArrowRight':
          e.preventDefault()
          onSeek(Math.min(durationRef.current, currentTime + 5))
          break
        case '[':
          e.preventDefault()
          onMarkCutStart?.()
          break
        case ']':
          e.preventDefault()
          onMarkCutEnd?.()
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isPlaying, currentTime, onPlay, onPause, onSeek, onMarkCutStart, onMarkCutEnd])

  const togglePlayPause = useCallback(() => {
    if (isPlaying) { onPause() } else { onPlay() }
  }, [isPlaying, onPlay, onPause])

  const speedOptions = [0.5, 1, 1.5, 2]

  return (
    <div ref={containerRef} className="flex flex-col bg-black rounded-lg overflow-hidden">
      {/* Video element */}
      <div className="relative w-full aspect-video bg-black">
        <video
          ref={videoRef}
          src={assetUrl(videoPath)}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          playsInline
        />
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/95 border-t border-zinc-800">
        {/* Restart */}
        <button
          onClick={() => onSeek(0)}
          className="p-1.5 text-zinc-400 hover:text-white transition-colors"
          title="Restart"
        >
          <SkipBack size={16} />
        </button>

        {/* -5s */}
        <button
          onClick={() => onSeek(Math.max(0, currentTime - 5))}
          className="p-1.5 text-zinc-400 hover:text-white transition-colors"
          title="Back 5s"
        >
          <Rewind size={16} />
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlayPause}
          className="p-1.5 text-white hover:text-blue-400 transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        {/* +5s */}
        <button
          onClick={() => onSeek(Math.min(durationRef.current, currentTime + 5))}
          className="p-1.5 text-zinc-400 hover:text-white transition-colors"
          title="Forward 5s"
        >
          <FastForward size={16} />
        </button>

        {/* Time display */}
        <span className="text-xs text-zinc-400 font-mono min-w-[100px]">
          {formatTime(currentTime)} / {formatTime(durationRef.current)}
        </span>

        <div className="flex-1" />

        {/* Volume */}
        <div className="flex items-center gap-1.5">
          <Volume2 size={14} className="text-zinc-400" />
          <input
            type="range"
            min={0}
            max={200}
            value={Math.round(volume * 100)}
            onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
            className="w-20 h-1 accent-white cursor-pointer"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
          <span className="text-[10px] text-zinc-500 w-8">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-1 ml-2">
          {speedOptions.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                speed === s
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
