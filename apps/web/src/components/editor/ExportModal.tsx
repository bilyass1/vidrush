'use client'

import { useState } from 'react'
import { X, FolderOpen, ChevronDown, ChevronRight, Zap, Download } from 'lucide-react'
import { tauriCommands, pickSavePath } from '@/lib/tauri'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExportSettings {
  width: number | null   // null = keep original
  height: number | null
  fps: number | null     // null = keep original
  crf: number            // 0 (lossless) → 51 (worst), 18=high, 23=good, 28=small
  audioBitrate: string
  format: 'mp4' | 'webm'
}

// ── Presets ───────────────────────────────────────────────────────────────────

const PRESETS: { label: string; icon?: string; s: ExportSettings }[] = [
  { label: 'YouTube 1080p 30fps',  icon: '▶', s: { width: 1920, height: 1080, fps: 30, crf: 23, audioBitrate: '192k', format: 'mp4' } },
  { label: 'YouTube 4K 30fps',     icon: '4K', s: { width: 3840, height: 2160, fps: 30, crf: 20, audioBitrate: '320k', format: 'mp4' } },
  { label: 'YouTube 4K 60fps',     icon: '⚡', s: { width: 3840, height: 2160, fps: 60, crf: 20, audioBitrate: '320k', format: 'mp4' } },
  { label: 'Shorts / TikTok 9:16', icon: '📱', s: { width: 1080, height: 1920, fps: 30, crf: 23, audioBitrate: '192k', format: 'mp4' } },
  { label: 'Instagram 1:1',        icon: '□',  s: { width: 1080, height: 1080, fps: 30, crf: 23, audioBitrate: '192k', format: 'mp4' } },
  { label: 'Original Quality',     icon: '★',  s: { width: null, height: null, fps: null, crf: 18, audioBitrate: '320k', format: 'mp4' } },
  { label: 'Small File 720p',      icon: '↓',  s: { width: 1280, height: 720,  fps: 30, crf: 28, audioBitrate: '128k', format: 'mp4' } },
]

const RESOLUTIONS = [
  { label: 'Original', w: null, h: null },
  { label: '720p',     w: 1280, h: 720  },
  { label: '1080p',    w: 1920, h: 1080 },
  { label: '1440p',    w: 2560, h: 1440 },
  { label: '4K',       w: 3840, h: 2160 },
]

const FPS_OPTIONS = [null, 24, 25, 30, 50, 60]
const AUDIO_BITRATES = ['96k', '128k', '192k', '256k', '320k']

function crfLabel(crf: number) {
  if (crf <= 18) return 'Lossless'
  if (crf <= 22) return 'High'
  if (crf <= 26) return 'Good'
  if (crf <= 30) return 'Medium'
  return 'Small'
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (outputPath: string, format: 'mp4' | 'webm', opts?: {
    outputWidth?: number; outputHeight?: number; targetFps?: number
    crf?: number; audioBitrate?: string
  }) => void
  isExporting: boolean
  exportProgress: number
  exportLog: string[]
  videoDuration: number
  cutsCount: number
  overlaysCount: number
  speed: number
  volume: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExportModal({
  isOpen, onClose, onExport,
  isExporting, exportProgress, exportLog,
  videoDuration, cutsCount, overlaysCount, speed, volume,
}: ExportModalProps) {
  const [settings, setSettings] = useState<ExportSettings>(PRESETS[0].s)
  const [outputPath, setOutputPath] = useState('vidrush_export.mp4')
  const [showLog, setShowLog] = useState(false)

  if (!isOpen) return null
  const isComplete = exportProgress >= 100

  const set = (patch: Partial<ExportSettings>) =>
    setSettings(prev => ({ ...prev, ...patch }))

  const applyPreset = (s: ExportSettings) => {
    setSettings(s)
    setOutputPath(p => p.replace(/\.(mp4|webm)$/, `.${s.format}`))
  }

  const handlePickPath = async () => {
    const p = await pickSavePath(`vidrush_export.${settings.format}`).catch(() => null)
    if (p) setOutputPath(p)
  }

  const handleStartExport = () => {
    onExport(outputPath, settings.format, {
      outputWidth:  settings.width  ?? undefined,
      outputHeight: settings.height ?? undefined,
      targetFps:    settings.fps    ?? undefined,
      crf:          settings.crf,
      audioBitrate: settings.audioBitrate,
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-[560px] flex flex-col max-h-[92vh] overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Download size={16} className="text-red-500" /> Export Video
          </h2>
          {!isExporting && !isComplete && (
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {(!isExporting && !isComplete) ? (
            <div className="p-5 space-y-5">

              {/* Summary strip */}
              <div className="flex gap-4 text-xs text-zinc-500 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5">
                <span>⏱ {formatTime(videoDuration)}</span>
                <span>✂ {cutsCount} cuts</span>
                <span>🎨 {overlaysCount} overlays</span>
                <span>⚡ {speed}x</span>
              </div>

              {/* Quick presets */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Quick Presets</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESETS.map(p => {
                    const active = settings.width === p.s.width && settings.height === p.s.height
                      && settings.fps === p.s.fps && settings.crf === p.s.crf
                    return (
                      <button
                        key={p.label}
                        onClick={() => applyPreset(p.s)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs transition-all',
                          active
                            ? 'border-red-500 bg-red-500/8 text-white'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white'
                        )}
                      >
                        <span className="text-base leading-none w-5 text-center">{p.icon}</span>
                        <span className="font-medium truncate">{p.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Custom settings ── */}
              <div className="space-y-4 bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Custom Settings</p>

                {/* Resolution */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Resolution</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {RESOLUTIONS.map(r => (
                      <button
                        key={r.label}
                        onClick={() => set({ width: r.w, height: r.h })}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-xs font-bold transition-all',
                          settings.width === r.w && settings.height === r.h
                            ? 'border-red-500 bg-red-500/10 text-white'
                            : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white'
                        )}
                      >
                        {r.label}
                        {r.w && <span className="ml-1 opacity-50 font-normal">{r.w}×{r.h}</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FPS */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Frame Rate</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {FPS_OPTIONS.map(f => (
                      <button
                        key={String(f)}
                        onClick={() => set({ fps: f })}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-xs font-bold transition-all',
                          settings.fps === f
                            ? 'border-red-500 bg-red-500/10 text-white'
                            : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white'
                        )}
                      >
                        {f === null ? 'Original' : `${f} fps`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality (CRF) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-zinc-400">Quality</label>
                    <span className="text-xs font-bold text-white">
                      {crfLabel(settings.crf)} <span className="text-zinc-500 font-normal">(CRF {settings.crf})</span>
                    </span>
                  </div>
                  <input
                    type="range" min={14} max={35} step={1}
                    value={settings.crf}
                    onChange={e => set({ crf: Number(e.target.value) })}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-red-500 bg-zinc-700"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-600">
                    <span>Lossless (large)</span>
                    <span>Small file</span>
                  </div>
                </div>

                {/* Audio bitrate */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Audio Bitrate</label>
                  <div className="flex gap-1.5">
                    {AUDIO_BITRATES.map(b => (
                      <button
                        key={b}
                        onClick={() => set({ audioBitrate: b })}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-xs font-bold transition-all',
                          settings.audioBitrate === b
                            ? 'border-red-500 bg-red-500/10 text-white'
                            : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white'
                        )}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Format</label>
                  <div className="flex gap-1.5">
                    {(['mp4', 'webm'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => {
                          set({ format: f })
                          setOutputPath(p => p.replace(/\.(mp4|webm)$/, `.${f}`))
                        }}
                        className={cn(
                          'px-4 py-1.5 rounded-lg border text-xs font-bold uppercase transition-all',
                          settings.format === f
                            ? 'border-red-500 bg-red-500/10 text-white'
                            : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white'
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Output path */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Save to</label>
                <div className="flex gap-2">
                  <input
                    type="text" value={outputPath}
                    onChange={e => setOutputPath(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                  <button
                    onClick={handlePickPath}
                    className="px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-white transition-colors"
                  >
                    Browse
                  </button>
                </div>
              </div>

              {/* Export summary line */}
              <div className="text-[11px] text-zinc-500 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono">
                ffmpeg -i input
                {settings.width ? ` -vf "scale=${settings.width}:${settings.height}${settings.fps ? `,fps=${settings.fps}` : ''}"` : settings.fps ? ` -vf "fps=${settings.fps}"` : ''}
                {` -crf ${settings.crf} -b:a ${settings.audioBitrate}`}
                {` output.${settings.format}`}
              </div>

              <button
                onClick={handleStartExport}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-red-900/20"
              >
                START EXPORT
              </button>
            </div>

          ) : isComplete ? (
            <div className="flex flex-col items-center justify-center py-8 px-6 space-y-4 text-center">
              <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center animate-bounce">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Export Complete!</h3>
              <p className="text-zinc-400 text-sm">Saved to:</p>
              <div className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-[11px] font-mono text-zinc-400 break-all">
                {outputPath}
              </div>
              <div className="flex gap-3 w-full justify-center pt-2">
                <button
                  onClick={() => tauriCommands.openFolder(outputPath.replace(/[/\\][^/\\]+$/, ''))}
                  className="px-5 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg flex items-center gap-2 text-sm text-white transition-colors"
                >
                  <FolderOpen size={15} /> Open Folder
                </button>
                <button
                  onClick={onClose}
                  className="px-7 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>

          ) : (
            <div className="flex flex-col items-center justify-center py-6 px-6 space-y-5">
              <div className="flex flex-col gap-3 w-full">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-semibold text-white">Rendering with FFmpeg...</span>
                  <span className="text-xl font-bold text-red-500 font-mono">{Math.floor(exportProgress)}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-red-600 to-orange-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>

              <div className="w-full space-y-1.5">
                <button
                  onClick={() => setShowLog(!showLog)}
                  className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest font-bold"
                >
                  {showLog ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  FFmpeg Log
                </button>
                {showLog ? (
                  <div className="w-full h-40 bg-black rounded-lg p-3 font-mono text-[10px] text-zinc-400 overflow-y-auto border border-zinc-800">
                    {exportLog.map((line, i) => <div key={i} className="mb-0.5 whitespace-pre-wrap">{line}</div>)}
                    <div className="animate-pulse">_</div>
                  </div>
                ) : (
                  <div className="w-full bg-black/40 border border-zinc-800 rounded-lg p-2 px-3 font-mono text-[10px] text-zinc-500 truncate">
                    {exportLog[exportLog.length - 1] || 'Initializing FFmpeg...'}
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
