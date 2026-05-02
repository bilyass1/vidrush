'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Download, ExternalLink, Play, X } from 'lucide-react'
import type { VideoGeneration } from '@vidrush/shared'
import { VideoStatus, VideoType } from '@vidrush/shared'

interface VideoCardProps {
  video: VideoGeneration
  onDownload?: (video: VideoGeneration) => void
  onOpenEditor?: (video: VideoGeneration) => void
  onPublish?: (video: VideoGeneration) => void
}

const statusColors: Record<VideoStatus, string> = {
  [VideoStatus.DONE]: 'bg-green-600/20 text-green-400',
  [VideoStatus.PENDING]: 'bg-yellow-600/20 text-yellow-400',
  [VideoStatus.SCRIPTING]: 'bg-yellow-600/20 text-yellow-400',
  [VideoStatus.VOICING]: 'bg-yellow-600/20 text-yellow-400',
  [VideoStatus.GENERATING]: 'bg-yellow-600/20 text-yellow-400',
  [VideoStatus.RENDERING]: 'bg-yellow-600/20 text-yellow-400',
  [VideoStatus.FAILED]: 'bg-red-600/20 text-red-400',
}

const typeGradients: Record<VideoType, string> = {
  [VideoType.YOUTUBE]: 'from-red-900/60 to-zinc-900',
  [VideoType.ECOMMERCE]: 'from-blue-900/60 to-zinc-900',
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function VideoPreviewModal({ video, onClose }: { video: VideoGeneration; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <p className="text-sm font-semibold text-white truncate max-w-[80%]">
            {video.inputPrompt || 'Untitled Video'}
          </p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video */}
        <div className="bg-black">
          <video
            src={video.outputUrl ?? undefined}
            controls
            autoPlay
            className="w-full max-h-[70vh] object-contain"
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-zinc-800">
          {video.outputUrl && (
            <a
              href={video.outputUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
            >
              <Download size={13} /> Download
            </a>
          )}
          <span className="ml-auto text-xs text-zinc-500">{formatDate(video.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

export default function VideoCard({ video, onDownload, onOpenEditor, onPublish }: VideoCardProps) {
  const isProcessing = ![VideoStatus.DONE, VideoStatus.FAILED].includes(video.status)
  const canPreview = video.status === VideoStatus.DONE && !!video.outputUrl
  const [showPreview, setShowPreview] = useState(false)

  return (
    <>
      <div className="group rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all hover:shadow-lg hover:shadow-black/20">
        {/* Thumbnail */}
        <div
          className={cn(
            'relative h-36 bg-gradient-to-br',
            typeGradients[video.type],
            canPreview && 'cursor-pointer'
          )}
          onClick={() => canPreview && setShowPreview(true)}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {isProcessing ? (
              <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            ) : canPreview ? (
              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all">
                <Play size={22} className="text-white ml-0.5" fill="white" />
              </div>
            ) : (
              <Play size={28} className="text-zinc-600" />
            )}
          </div>

          {/* Hover overlay for playable cards */}
          {canPreview && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          )}

          {/* Type badge */}
          <span className="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/50 text-zinc-300">
            {video.type}
          </span>
          {/* Status badge */}
          <span
            className={cn(
              'absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded',
              statusColors[video.status]
            )}
          >
            {video.status}
          </span>
          {/* Pipeline badge */}
          {video.pipeline && (
            <span className={cn(
              'absolute bottom-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded',
              video.pipeline === 'free'
                ? 'bg-zinc-700/80 text-zinc-300'
                : 'bg-purple-600/30 text-purple-300'
            )}>
              {video.pipeline === 'free' ? 'Local' : 'AI Cloud'}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3.5 space-y-2">
          <h3 className="font-medium text-sm text-white truncate">
            {video.inputPrompt || 'Untitled Video'}
          </h3>
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{video.durationMin ? `${video.durationMin.toFixed(1)} min` : '--'}</span>
            <span>{formatDate(video.createdAt)}</span>
          </div>

          {/* Actions */}
          {video.status === VideoStatus.DONE && (
            <div className="flex items-center gap-1.5 pt-1">
              {onDownload && (
                <button
                  onClick={() => onDownload(video)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  <Download size={12} /> Download
                </button>
              )}
              {onOpenEditor && (
                <button
                  onClick={() => onOpenEditor(video)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  <ExternalLink size={12} /> Editor
                </button>
              )}
              {onPublish && video.type === VideoType.YOUTUBE && (
                <button
                  onClick={() => onPublish(video)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-md bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                >
                  <Play size={12} /> Publish
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showPreview && (
        <VideoPreviewModal video={video} onClose={() => setShowPreview(false)} />
      )}
    </>
  )
}

export function VideoCardSkeleton() {
  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden animate-pulse">
      <div className="h-36 bg-zinc-800" />
      <div className="p-3.5 space-y-3">
        <div className="h-4 w-3/4 bg-zinc-800 rounded" />
        <div className="flex justify-between">
          <div className="h-3 w-16 bg-zinc-800 rounded" />
          <div className="h-3 w-20 bg-zinc-800 rounded" />
        </div>
      </div>
    </div>
  )
}
