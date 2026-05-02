'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { EditorOverlay } from '@/hooks/useEditor'

// Grid size in px (used for snap)
const GRID_PX = 20

type ResizeHandle =
  | 'nw' | 'n' | 'ne'
  | 'w'           | 'e'
  | 'sw' | 's' | 'se'

interface VideoOverlayProps {
  overlays: EditorOverlay[]
  selectedId: string | null
  selectedIds: string[]
  currentTime: number
  snapToGrid: boolean
  showGrid: boolean
  containerWidth: number   // px, used for % ↔ px conversion
  containerHeight: number
  onSelect: (id: string | null, addToSelection?: boolean) => void
  onMove: (id: string, newX: number, newY: number) => void
  onResize: (id: string, newX: number, newY: number, newW: number, newH: number) => void
}

function snapVal(v: number, snap: boolean): number {
  if (!snap) return v
  return Math.round(v / GRID_PX) * GRID_PX
}

function pctToPx(pct: number, total: number): number {
  return (pct / 100) * total
}

function pxToPct(px: number, total: number): number {
  return Math.max(0, Math.min((px / total) * 100, 100))
}

export default function VideoOverlay({
  overlays,
  selectedId,
  selectedIds,
  currentTime,
  snapToGrid,
  showGrid,
  containerWidth,
  containerHeight,
  onSelect,
  onMove,
  onResize,
}: VideoOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // drag state
  const dragState = useRef<{
    type: 'move' | 'resize'
    ids: string[]          // overlays being moved
    startMouseX: number
    startMouseY: number
    startPositions: { id: string; x: number; y: number }[]
    // resize only
    handle?: ResizeHandle
    overlayId?: string
    startX?: number; startY?: number; startW?: number; startH?: number
  } | null>(null)

  // ── Active overlays at current time ─────────────────────────────────────

  const activeOverlays = overlays.filter(
    (o) => currentTime >= o.startT && currentTime <= o.endT
  )

  // ── Drag handlers ────────────────────────────────────────────────────────

  const handleMoveStart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    const addToSel = e.ctrlKey || e.metaKey
    onSelect(id, addToSel)

    // Build list of overlay IDs to move together
    const movingIds = addToSel
      ? [...new Set([...selectedIds, id])]
      : selectedIds.includes(id)
      ? selectedIds
      : [id]

    dragState.current = {
      type: 'move',
      ids: movingIds,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPositions: overlays
        .filter((o) => movingIds.includes(o.id))
        .map((o) => ({ id: o.id, x: o.x, y: o.y })),
    }
  }

  const handleResizeStart = (e: React.MouseEvent, id: string, handle: ResizeHandle) => {
    e.stopPropagation()
    e.preventDefault()
    const ov = overlays.find((o) => o.id === id)
    if (!ov) return
    dragState.current = {
      type: 'resize',
      ids: [id],
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPositions: [{ id: ov.id, x: ov.x, y: ov.y }],
      handle,
      overlayId: id,
      startX: ov.x,
      startY: ov.y,
      startW: ov.width || 15,
      startH: ov.height || 10,
    }
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const ds = dragState.current
      if (!ds || containerWidth === 0 || containerHeight === 0) return

      const dx = e.clientX - ds.startMouseX
      const dy = e.clientY - ds.startMouseY

      if (ds.type === 'move') {
        const dxPct = (dx / containerWidth) * 100
        const dyPct = (dy / containerHeight) * 100
        for (const sp of ds.startPositions) {
          let nx = sp.x + dxPct
          let ny = sp.y + dyPct
          if (snapToGrid) {
            const nxPx = snapVal(pctToPx(nx, containerWidth), true)
            const nyPx = snapVal(pctToPx(ny, containerHeight), true)
            nx = pxToPct(nxPx, containerWidth)
            ny = pxToPct(nyPx, containerHeight)
          }
          onMove(sp.id, Math.max(0, Math.min(100, nx)), Math.max(0, Math.min(100, ny)))
        }
      }

      if (ds.type === 'resize' && ds.overlayId && ds.handle) {
        const dxPct = (dx / containerWidth) * 100
        const dyPct = (dy / containerHeight) * 100
        let nx = ds.startX!
        let ny = ds.startY!
        let nw = ds.startW!
        let nh = ds.startH!

        const h = ds.handle
        if (h.includes('e')) nw = Math.max(2, ds.startW! + dxPct)
        if (h.includes('s')) nh = Math.max(2, ds.startH! + dyPct)
        if (h.includes('w')) { nw = Math.max(2, ds.startW! - dxPct); nx = ds.startX! + dxPct }
        if (h.includes('n')) { nh = Math.max(2, ds.startH! - dyPct); ny = ds.startY! + dyPct }

        // Proportional for corners
        if ((h === 'nw' || h === 'ne' || h === 'sw' || h === 'se') && ds.startW! > 0) {
          const ratio = ds.startH! / ds.startW!
          nh = nw * ratio
          if (h.includes('n')) ny = ds.startY! + (ds.startH! - nh)
        }

        onResize(ds.overlayId, nx, ny, nw, nh)
      }
    }

    const onMouseUp = () => { dragState.current = null }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [snapToGrid, containerWidth, containerHeight, onMove, onResize])

  // ── Resize handle positions ──────────────────────────────────────────────

  const handles: ResizeHandle[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']

  const handleStyle = (h: ResizeHandle): React.CSSProperties => {
    const pos: React.CSSProperties = { position: 'absolute', width: 8, height: 8, background: '#3b82f6', border: '1px solid white', borderRadius: 1 }
    if (h.includes('n')) pos.top = -4
    else if (h.includes('s')) pos.bottom = -4
    else pos.top = '50%', pos.transform = 'translateY(-50%)'
    if (h.includes('w')) pos.left = -4
    else if (h.includes('e')) pos.right = -4
    else pos.left = '50%', pos.transform = (pos.transform ? pos.transform + ' ' : '') + 'translateX(-50%)'
    pos.cursor =
      h === 'nw' || h === 'se' ? 'nwse-resize'
      : h === 'ne' || h === 'sw' ? 'nesw-resize'
      : h === 'n'  || h === 's'  ? 'ns-resize'
      : 'ew-resize'
    return pos
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      onClick={() => onSelect(null)}
    >
      {/* Grid overlay */}
      {showGrid && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width={GRID_PX} height={GRID_PX} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID_PX} 0 L 0 0 0 ${GRID_PX}`} fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      )}

      {activeOverlays
        .slice()
        .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
        .map((o) => {
          const isSelected = o.id === selectedId
          const isInSelection = selectedIds.includes(o.id)
          const hasSize = o.width > 0 && o.height > 0

          const bgStyle: React.CSSProperties =
            o.background === 'black50'
              ? { background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '2px 6px' }
              : o.background === 'white50'
              ? { background: 'rgba(255,255,255,0.5)', borderRadius: 4, padding: '2px 6px' }
              : {}

          return (
            <div
              key={o.id}
              className={`absolute pointer-events-auto cursor-move select-none -translate-x-1/2 -translate-y-1/2 ${
                isInSelection ? 'ring-2 ring-blue-400 rounded' : ''
              } ${isSelected ? 'ring-2 ring-blue-500 rounded' : ''}`}
              style={{
                left: `${o.x}%`,
                top: `${o.y}%`,
                zIndex: (o.zIndex ?? 0) + 1,
                ...(hasSize
                  ? {
                      width: `${o.width}%`,
                      height: `${o.height}%`,
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: o.textAlign === 'left' ? 'flex-start' : o.textAlign === 'right' ? 'flex-end' : 'center',
                    }
                  : {}),
              }}
              onMouseDown={(e) => handleMoveStart(e, o.id)}
              onClick={(e) => { e.stopPropagation(); onSelect(o.id, e.ctrlKey || e.metaKey) }}
            >
              {o.overlayType === 'text' ? (
                <span style={{
                  fontSize: o.fontSize,
                  color: o.color,
                  fontWeight: o.fontWeight ?? 'normal',
                  textAlign: o.textAlign ?? 'center',
                  whiteSpace: 'nowrap',
                  textShadow: o.shadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
                  WebkitTextStroke: o.outline ? `1px ${o.outlineColor || '#000000'}` : 'none',
                  ...bgStyle,
                }}>
                  {o.content}
                </span>
              ) : (
                <img
                  src={o.content}
                  alt="sticker"
                  className="pointer-events-none drop-shadow-md"
                  style={hasSize ? { width: '100%', height: '100%', objectFit: 'contain' } : { maxWidth: 200, maxHeight: 200 }}
                />
              )}

              {/* Resize handles — shown only for primary selected */}
              {isSelected && handles.map((h) => (
                <div
                  key={h}
                  style={handleStyle(h)}
                  onMouseDown={(e) => handleResizeStart(e, o.id, h)}
                />
              ))}
            </div>
          )
        })}
    </div>
  )
}
