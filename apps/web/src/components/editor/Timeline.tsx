'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, Maximize2, Music, Film, Scissors, Type, GripVertical, Plus } from 'lucide-react'
import { assetUrl } from '@/lib/tauri'
import type { EditorCut, EditorOverlay, EditorAudioTrack } from '@/hooks/useEditor'

interface TimelineProps {
  duration: number
  currentTime: number
  thumbnails: string[]
  cuts: EditorCut[]
  overlays: EditorOverlay[]
  audioTracks: EditorAudioTrack[]
  selectedOverlayId: string | null
  selectedAudioId: string | null
  zoomLevel: 1 | 2 | 4 | 8
  onSeek: (seconds: number) => void
  onAddCut: (startSec: number, endSec: number) => void
  onRemoveCut: (id: string) => void
  onUpdateCut: (id: string, startSec: number, endSec: number) => void
  onZoomChange: (z: 1 | 2 | 4 | 8) => void
  onSelectOverlay: (id: string) => void
  onUpdateOverlayTiming: (id: string, startT: number, endT: number) => void
  onSelectAudio: (id: string) => void
  onUpdateAudioTiming: (id: string, startT: number) => void
  onRemoveAudio: (id: string) => void
}

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const ZOOM_LEVELS: (1 | 2 | 4 | 8)[] = [1, 2, 4, 8]
const TICK_INTERVAL: Record<number, number> = { 1: 10, 2: 5, 4: 2, 8: 1 }
const LABEL_W = 76
const TRACK_H = 38

export default function Timeline({
  duration,
  currentTime,
  thumbnails,
  cuts,
  overlays,
  audioTracks,
  selectedOverlayId,
  selectedAudioId,
  zoomLevel,
  onSeek,
  onAddCut,
  onRemoveCut,
  onUpdateCut,
  onZoomChange,
  onSelectOverlay,
  onUpdateOverlayTiming,
  onSelectAudio,
  onUpdateAudioTiming,
  onRemoveAudio,
}: TimelineProps) {

  // ── Panel resize ──────────────────────────────────────────────────────────
  const [panelH, setPanelH] = useState(280)
  const panelResizing = useRef(false)
  const panelResizeY0 = useRef(0)
  const panelResizeH0 = useRef(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!panelResizing.current) return
      const dy = panelResizeY0.current - e.clientY
      setPanelH(Math.max(180, Math.min(560, panelResizeH0.current + dy)))
    }
    const onUp = () => { panelResizing.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  // ── Refs ──────────────────────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null)   // the scrollable container
  const innerRef  = useRef<HTMLDivElement>(null)   // the wide inner div

  // ── Cut-mark state ────────────────────────────────────────────────────────
  const [cutStart, setCutStart] = useState<number | null>(null)

  // ── Drag / resize state ───────────────────────────────────────────────────
  type DragKind =
    | { kind: 'playhead' }
    | { kind: 'overlay-move';  id: string; origStart: number; origEnd: number;   mouseX0: number }
    | { kind: 'overlay-left';  id: string; origStart: number; origEnd: number;   mouseX0: number }
    | { kind: 'overlay-right'; id: string; origStart: number; origEnd: number;   mouseX0: number }
    | { kind: 'audio-move';    id: string; origStart: number;                    mouseX0: number }
    | { kind: 'cut-left';      id: string; origStart: number; origEnd: number;   mouseX0: number }
    | { kind: 'cut-right';     id: string; origStart: number; origEnd: number;   mouseX0: number }

  const drag = useRef<DragKind | null>(null)

  // ── px-per-second (accounts for zoom + scroll container width) ────────────
  const pxPerSec = useCallback((): number => {
    if (!scrollRef.current || duration === 0) return 1
    return (scrollRef.current.clientWidth * zoomLevel) / duration
  }, [duration, zoomLevel])

  // ── clientX → time (accounts for scroll offset) ───────────────────────────
  const xToTime = useCallback((clientX: number): number => {
    if (!scrollRef.current || duration === 0) return 0
    const rect = scrollRef.current.getBoundingClientRect()
    const scrollLeft = scrollRef.current.scrollLeft
    const x = clientX - rect.left + scrollLeft
    const totalW = scrollRef.current.clientWidth * zoomLevel
    return Math.max(0, Math.min(duration, (x / totalW) * duration))
  }, [duration, zoomLevel])

  // ── time → % of inner width ───────────────────────────────────────────────
  const toPct = useCallback((t: number) =>
    duration > 0 ? `${(t / duration) * 100}%` : '0%'
  , [duration])

  const toWidthPct = useCallback((dt: number) =>
    duration > 0 ? `${(dt / duration) * 100}%` : '0%'
  , [duration])

  // ── Global mouse move / up ────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = drag.current
      if (!d || !scrollRef.current) return

      const rect = scrollRef.current.getBoundingClientRect()
      const scrollLeft = scrollRef.current.scrollLeft
      const totalW = scrollRef.current.clientWidth * zoomLevel

      // delta in seconds from drag start
      const dxPx = e.clientX - (d as any).mouseX0
      const dt   = (dxPx / totalW) * duration

      if (d.kind === 'playhead') {
        onSeek(xToTime(e.clientX))
        return
      }

      if (d.kind === 'overlay-move') {
        const len = d.origEnd - d.origStart
        const ns  = Math.max(0, Math.min(duration - len, d.origStart + dt))
        onUpdateOverlayTiming(d.id, ns, ns + len)
        return
      }
      if (d.kind === 'overlay-left') {
        const ns = Math.max(0, Math.min(d.origEnd - 0.1, d.origStart + dt))
        onUpdateOverlayTiming(d.id, ns, d.origEnd)
        return
      }
      if (d.kind === 'overlay-right') {
        const ne = Math.max(d.origStart + 0.1, Math.min(duration, d.origEnd + dt))
        onUpdateOverlayTiming(d.id, d.origStart, ne)
        return
      }
      if (d.kind === 'audio-move') {
        const ns = Math.max(0, d.origStart + dt)
        onUpdateAudioTiming(d.id, ns)
        return
      }
      if (d.kind === 'cut-left') {
        const ns = Math.max(0, Math.min(d.origEnd - 0.1, d.origStart + dt))
        onUpdateCut(d.id, ns, d.origEnd)
        return
      }
      if (d.kind === 'cut-right') {
        const ne = Math.max(d.origStart + 0.1, Math.min(duration, d.origEnd + dt))
        onUpdateCut(d.id, d.origStart, ne)
        return
      }
    }

    const onUp = () => { drag.current = null }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [duration, zoomLevel, onSeek, onUpdateOverlayTiming, onUpdateAudioTiming, onUpdateCut, xToTime])

  // ── Ruler ticks ───────────────────────────────────────────────────────────
  const interval = TICK_INTERVAL[zoomLevel]
  const ticks: number[] = []
  for (let t = 0; t <= duration; t += interval) ticks.push(t)

  // ── Track definitions ─────────────────────────────────────────────────────
  const trackDefs = [
    { id: 'video',    label: 'Video',    icon: <Film size={11} />,     accent: '#52525b' },
    { id: 'cuts',     label: 'Cuts',     icon: <Scissors size={11} />, accent: '#ef4444' },
    { id: 'overlays', label: 'Overlays', icon: <Type size={11} />,     accent: '#3b82f6' },
    ...audioTracks.map((a, i) => ({
      id: `audio::${a.id}`,
      label: `Audio ${i + 1}`,
      icon: <Music size={11} />,
      accent: '#10b981',
      audio: a,
    })),
  ]

  const innerW = `${zoomLevel * 100}%`

  return (
    <div
      className="flex flex-col bg-zinc-950 border-t border-zinc-800 select-none"
      style={{ height: panelH, minHeight: panelH }}
    >
      {/* ── Drag-to-resize grip ── */}
      <div
        className="h-2 shrink-0 flex items-center justify-center cursor-row-resize bg-zinc-900 hover:bg-zinc-800 transition-colors group"
        onMouseDown={(e) => {
          e.preventDefault()
          panelResizing.current = true
          panelResizeY0.current = e.clientY
          panelResizeH0.current = panelH
        }}
      >
        <GripVertical size={12} className="rotate-90 text-zinc-600 group-hover:text-zinc-400" />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-3 h-9 shrink-0 bg-zinc-950 border-b border-zinc-800">
        {/* Time display */}
        <span className="text-[11px] font-mono text-zinc-400 w-[90px]">
          {fmt(currentTime)} / {fmt(duration)}
        </span>

        <div className="w-px h-4 bg-zinc-800" />

        {/* Cut tool */}
        <button
          title={cutStart === null ? 'Click to set cut start point' : `Cut start: ${fmt(cutStart)} — click to set end`}
          onClick={() => {
            if (cutStart === null) {
              setCutStart(currentTime)
            } else {
              if (currentTime > cutStart) {
                onAddCut(cutStart, currentTime)
              }
              setCutStart(null)
            }
          }}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
            cutStart !== null
              ? 'bg-red-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          <Scissors size={12} />
          {cutStart === null ? 'Cut' : `End cut @ ${fmt(currentTime)}`}
        </button>

        {cutStart !== null && (
          <button
            onClick={() => setCutStart(null)}
            className="text-zinc-500 hover:text-white p-1"
            title="Cancel cut"
          >
            <X size={12} />
          </button>
        )}

        <div className="flex-1" />

        {/* Zoom */}
        <button
          onClick={() => onZoomChange(ZOOM_LEVELS[Math.max(0, ZOOM_LEVELS.indexOf(zoomLevel) - 1)])}
          disabled={zoomLevel === 1}
          className="p-1 text-zinc-500 hover:text-white disabled:opacity-30"
        >
          <ZoomOut size={13} />
        </button>
        <span className="text-[11px] text-zinc-500 w-5 text-center">{zoomLevel}x</span>
        <button
          onClick={() => onZoomChange(ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, ZOOM_LEVELS.indexOf(zoomLevel) + 1)])}
          disabled={zoomLevel === 8}
          className="p-1 text-zinc-500 hover:text-white disabled:opacity-30"
        >
          <ZoomIn size={13} />
        </button>
        <button onClick={() => onZoomChange(1)} className="p-1 text-zinc-500 hover:text-white">
          <Maximize2 size={13} />
        </button>
      </div>

      {/* ── Body: labels + scrollable tracks ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Labels column */}
        <div className="shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col" style={{ width: LABEL_W }}>
          {/* Ruler spacer */}
          <div className="shrink-0 border-b border-zinc-800" style={{ height: 22 }} />
          {trackDefs.map(tr => (
            <div
              key={tr.id}
              className="shrink-0 flex items-center gap-1.5 px-2 border-b border-zinc-800/50"
              style={{ height: TRACK_H }}
            >
              <span style={{ color: tr.accent }}>{tr.icon}</span>
              <span className="text-[10px] text-zinc-500 truncate font-medium">{tr.label}</span>
            </div>
          ))}
        </div>

        {/* Scrollable area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar"
          style={{ position: 'relative' }}
        >
          <div ref={innerRef} style={{ width: innerW, minWidth: '100%', position: 'relative' }}>

            {/* ── Ruler ── */}
            <div
              className="bg-zinc-900 border-b border-zinc-800 relative cursor-crosshair"
              style={{ height: 22 }}
              onClick={(e) => onSeek(xToTime(e.clientX))}
            >
              {ticks.map(t => {
                const major = t % (interval * 2) === 0
                return (
                  <div
                    key={t}
                    className="absolute top-0 flex flex-col items-center pointer-events-none"
                    style={{ left: toPct(t) }}
                  >
                    <div className={`w-px ${major ? 'h-3 bg-zinc-500' : 'h-1.5 bg-zinc-700'}`} />
                    {major && (
                      <span className="text-[8px] text-zinc-500 whitespace-nowrap mt-0.5">
                        {fmt(t)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* ── Track rows ── */}
            {trackDefs.map(tr => (
              <div
                key={tr.id}
                className="relative border-b border-zinc-800/40"
                style={{ height: TRACK_H }}
              >
                {/* subtle row tint */}
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{ background: tr.accent }}
                />

                {/* VIDEO — filmstrip */}
                {tr.id === 'video' && duration > 0 && (
                  <div className="absolute inset-y-1 left-0 right-0 flex rounded overflow-hidden pointer-events-none opacity-50">
                    {thumbnails.map((th, i) => (
                      <img key={i} src={assetUrl(th)} className="flex-1 object-cover min-w-0" alt="" />
                    ))}
                    <div className="absolute inset-0 border border-zinc-600 rounded" />
                  </div>
                )}

                {/* CUTS */}
                {tr.id === 'cuts' && cuts.map(c => (
                  <div
                    key={c.id}
                    className="absolute inset-y-1 group"
                    style={{ left: toPct(c.startSec), width: toWidthPct(c.endSec - c.startSec) }}
                  >
                    <div className="absolute inset-0 bg-red-500/20 border border-red-500/60 rounded flex items-center justify-center">
                      <span className="text-[9px] text-red-300 pointer-events-none select-none">✂ {fmt(c.startSec)}–{fmt(c.endSec)}</span>
                      <button
                        className="absolute right-0.5 top-0.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-white transition-opacity"
                        onClick={(e) => { e.stopPropagation(); onRemoveCut(c.id) }}
                      >
                        <X size={9} />
                      </button>
                    </div>
                    {/* left edge */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 hover:bg-red-400/30 rounded-l"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        drag.current = { kind: 'cut-left', id: c.id, origStart: c.startSec, origEnd: c.endSec, mouseX0: e.clientX }
                      }}
                    />
                    {/* right edge */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 hover:bg-red-400/30 rounded-r"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        drag.current = { kind: 'cut-right', id: c.id, origStart: c.startSec, origEnd: c.endSec, mouseX0: e.clientX }
                      }}
                    />
                  </div>
                ))}

                {/* OVERLAYS */}
                {tr.id === 'overlays' && overlays.map(o => (
                  <div
                    key={o.id}
                    className="absolute inset-y-1 group"
                    style={{ left: toPct(o.startT), width: toWidthPct(o.endT - o.startT) }}
                  >
                    <div
                      className={`absolute inset-0 rounded border flex items-center px-2 cursor-move
                        bg-blue-500/25 border-blue-500/60 hover:border-blue-400
                        ${o.id === selectedOverlayId ? 'ring-1 ring-white' : ''}`}
                      onClick={() => onSelectOverlay(o.id)}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        drag.current = { kind: 'overlay-move', id: o.id, origStart: o.startT, origEnd: o.endT, mouseX0: e.clientX }
                      }}
                    >
                      <Type size={9} className="text-blue-300 shrink-0 mr-1" />
                      <span className="text-[10px] text-blue-200 truncate pointer-events-none">{o.content}</span>
                    </div>
                    {/* left resize */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 hover:bg-blue-400/30 rounded-l"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        drag.current = { kind: 'overlay-left', id: o.id, origStart: o.startT, origEnd: o.endT, mouseX0: e.clientX }
                      }}
                    />
                    {/* right resize */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 hover:bg-blue-400/30 rounded-r"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        drag.current = { kind: 'overlay-right', id: o.id, origStart: o.startT, origEnd: o.endT, mouseX0: e.clientX }
                      }}
                    />
                  </div>
                ))}

                {/* AUDIO */}
                {(tr as any).audio && (() => {
                  const a: EditorAudioTrack = (tr as any).audio
                  return (
                    <div
                      className="absolute inset-y-1 group"
                      style={{ left: toPct(a.startT), width: toWidthPct(a.duration) }}
                    >
                      <div
                        className={`absolute inset-0 rounded border flex items-center cursor-move
                          bg-emerald-500/20 border-emerald-500/50 hover:border-emerald-400
                          ${a.id === selectedAudioId ? 'ring-1 ring-white' : ''}`}
                        onClick={() => onSelectAudio(a.id)}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          drag.current = { kind: 'audio-move', id: a.id, origStart: a.startT, mouseX0: e.clientX }
                        }}
                      >
                        <Music size={9} className="ml-2 mr-1 text-emerald-300 shrink-0" />
                        <span className="text-[10px] text-emerald-200 truncate pointer-events-none flex-1">{a.name}</span>
                        <button
                          className="mr-1 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 transition-opacity shrink-0"
                          onClick={(e) => { e.stopPropagation(); onRemoveAudio(a.id) }}
                        >
                          <X size={9} />
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </div>
            ))}

            {/* ── Playhead ── */}
            {duration > 0 && (
              <div
                className="absolute top-0 bottom-0 z-50 pointer-events-none"
                style={{ left: toPct(currentTime) }}
              >
                <div className="absolute top-0 bottom-0 w-[2px] bg-red-500 -translate-x-px" />
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rotate-45 cursor-ew-resize pointer-events-auto"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    drag.current = { kind: 'playhead' }
                  }}
                />
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-mono px-1 rounded pointer-events-none whitespace-nowrap">
                  {fmt(currentTime)}
                </div>
              </div>
            )}

            {/* ── Cut start marker ── */}
            {cutStart !== null && (
              <div
                className="absolute top-0 bottom-0 z-40 pointer-events-none"
                style={{ left: toPct(cutStart) }}
              >
                <div className="absolute top-0 bottom-0 w-[2px] bg-yellow-400 -translate-x-px" />
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[9px] font-mono px-1 rounded whitespace-nowrap">
                  {fmt(cutStart)}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
