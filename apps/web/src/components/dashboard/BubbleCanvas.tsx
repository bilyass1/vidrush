'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const STATUS_PHRASES = [
  'Cooking your idea...',
  'Crafting the hook...',
  'Designing scenes...',
  'Adding viral spice...',
  'Polishing the visuals...',
  'Almost ready...',
]

const STREAMS = [
  { r: 255, g: 50,  b: 50,  angle: -145, label: 'NEURAL NETWORK',  lx: 0.18, ly: 0.22 },
  { r: 60,  g: 110, b: 255, angle: -38,  label: 'COGNITION',        lx: 0.83, ly: 0.13 },
  { r: 0,   g: 200, b: 255, angle: 160,  label: 'MEMORY CLUSTER',   lx: 0.12, ly: 0.56 },
  { r: 255, g: 165, b: 0,   angle: 18,   label: 'DATA PROCESSING',  lx: 0.78, ly: 0.44 },
  { r: 0,   g: 200, b: 80,  angle: 122,  label: 'LEARNING INPUT',   lx: 0.80, ly: 0.72 },
]

const HELIX_AMPLITUDE   = 30     // px at full extent
const HELIX_WAVELENGTH  = 135    // px per full sine cycle
const HELIX_SEGMENTS    = 90     // polyline samples
const RUNGS_PER_STREAM  = 16

function buildHelixPath(
  cx: number, cy: number,
  ex: number, ey: number,
  amp: number, wavelength: number,
  phase: number,
): string {
  const dx = ex - cx, dy = ey - cy
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const ux = dx / len, uy = dy / len
  const px = -uy,     py = ux
  let d = ''
  for (let i = 0; i <= HELIX_SEGMENTS; i++) {
    const t        = i / HELIX_SEGMENTS
    const axial    = t * len
    const envelope = 0.22 + 0.78 * t            // amplitude grows outward → teardrop
    const lateral  = amp * envelope * Math.sin((2 * Math.PI * axial) / wavelength + phase)
    const x = cx + ux * axial + px * lateral
    const y = cy + uy * axial + py * lateral
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' '
  }
  return d
}

function buildRungs(
  cx: number, cy: number,
  ex: number, ey: number,
  amp: number, wavelength: number,
  count: number,
): Array<{ x1: number; y1: number; x2: number; y2: number; t: number }> {
  const dx = ex - cx, dy = ey - cy
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const ux = dx / len, uy = dy / len
  const px = -uy,     py = ux
  const rungs: Array<{ x1:number; y1:number; x2:number; y2:number; t:number }> = []
  for (let i = 0; i < count; i++) {
    const t        = (i + 0.5) / count
    const axial    = t * len
    const envelope = 0.22 + 0.78 * t
    const s        = Math.sin((2 * Math.PI * axial) / wavelength) * envelope * amp
    const axX = cx + ux * axial
    const axY = cy + uy * axial
    rungs.push({
      x1: axX + px * s, y1: axY + py * s,
      x2: axX - px * s, y2: axY - py * s,
      t,
    })
  }
  return rungs
}

const DNA_CSS = `
  @keyframes dna-flow {
    from { stroke-dashoffset: 0; }
    to   { stroke-dashoffset: -90; }
  }
  @keyframes dna-flow-reverse {
    from { stroke-dashoffset: 0; }
    to   { stroke-dashoffset: 90; }
  }
  @keyframes dna-rung-pulse {
    0%, 100% { opacity: 0; stroke-width: 0.6; }
    45%, 55% { opacity: 0.95; stroke-width: 2; }
  }
  @keyframes dna-breathe {
    0%, 100% { transform: scale(1);    filter: brightness(1); }
    50%      { transform: scale(1.02); filter: brightness(1.3); }
  }
  @keyframes dna-hue {
    from { filter: hue-rotate(-12deg); }
    to   { filter: hue-rotate(12deg); }
  }
`

interface DnaStreamProps {
  cx: number; cy: number; ex: number; ey: number
  color: { r: number; g: number; b: number }
  index: number
}

function DnaStream({ cx, cy, ex, ey, color, index }: DnaStreamProps) {
  const path1 = useMemo(
    () => buildHelixPath(cx, cy, ex, ey, HELIX_AMPLITUDE, HELIX_WAVELENGTH, 0),
    [cx, cy, ex, ey],
  )
  const path2 = useMemo(
    () => buildHelixPath(cx, cy, ex, ey, HELIX_AMPLITUDE, HELIX_WAVELENGTH, Math.PI),
    [cx, cy, ex, ey],
  )
  const rungs = useMemo(
    () => buildRungs(cx, cy, ex, ey, HELIX_AMPLITUDE, HELIX_WAVELENGTH, RUNGS_PER_STREAM),
    [cx, cy, ex, ey],
  )

  const col      = `rgb(${color.r},${color.g},${color.b})`
  const colFaint = `rgba(${color.r},${color.g},${color.b},0.22)`
  const colGlow  = `rgba(${color.r},${color.g},${color.b},0.08)`
  const flow     = 2.4 + index * 0.13

  return (
    <g style={{
      animation: `dna-breathe ${(flow * 1.6).toFixed(2)}s ease-in-out infinite, dna-hue ${(flow * 2.3).toFixed(2)}s ease-in-out infinite alternate`,
      transformOrigin: `${cx}px ${cy}px`,
    }}>
      {/* Outer soft halo */}
      <path d={path1} stroke={colGlow} strokeWidth="36" fill="none" strokeLinecap="round" />
      <path d={path2} stroke={colGlow} strokeWidth="36" fill="none" strokeLinecap="round" />

      {/* Inner halo */}
      <path d={path1} stroke={colGlow} strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d={path2} stroke={colGlow} strokeWidth="14" fill="none" strokeLinecap="round" />

      {/* Base-pair rungs — pulse outward with distance */}
      {rungs.map((r, i) => (
        <line
          key={`rung-${i}`}
          x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
          stroke={col}
          strokeLinecap="round"
          style={{
            animation: `dna-rung-pulse ${(flow * 1.25).toFixed(2)}s ease-in-out infinite`,
            animationDelay: `${(-r.t * flow * 0.75).toFixed(2)}s`,
            filter: `drop-shadow(0 0 5px ${col})`,
          }}
        />
      ))}

      {/* Continuous faint backbone */}
      <path d={path1} stroke={colFaint} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d={path2} stroke={colFaint} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Flowing bright dashes — strand 1 */}
      <path
        d={path1}
        stroke={col}
        strokeWidth="3.2"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="2 12 4 8 2 16"
        style={{
          animation: `dna-flow ${flow.toFixed(2)}s linear infinite`,
          filter: `drop-shadow(0 0 5px ${col}) drop-shadow(0 0 14px ${col})`,
        }}
      />
      {/* Flowing bright dashes — strand 2 (out of phase) */}
      <path
        d={path2}
        stroke={col}
        strokeWidth="3.2"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="2 12 4 8 2 16"
        style={{
          animation: `dna-flow-reverse ${(flow * 1.05).toFixed(2)}s linear infinite`,
          filter: `drop-shadow(0 0 5px ${col}) drop-shadow(0 0 14px ${col})`,
        }}
      />
    </g>
  )
}

interface BubbleCanvasProps {
  visible: boolean
  onFadeOutComplete?: () => void
}

export default function BubbleCanvas({ visible, onFadeOutComplete }: BubbleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const startTime = useRef(0)

  const [size, setSize] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth  : 1920,
    h: typeof window !== 'undefined' ? window.innerHeight : 1080,
  }))

  const [phraseIndex,    setPhraseIndex]    = useState(0)
  const [overlayOpacity, setOverlayOpacity] = useState(0)
  const [fadingOut,      setFadingOut]      = useState(false)

  useEffect(() => {
    if (!visible || fadingOut) return
    const id = setInterval(() => setPhraseIndex(p => (p + 1) % STATUS_PHRASES.length), 2800)
    return () => clearInterval(id)
  }, [visible, fadingOut])

  useEffect(() => {
    if (visible && !fadingOut) {
      setOverlayOpacity(1)
    } else if (!visible && overlayOpacity > 0) {
      setFadingOut(true)
      setOverlayOpacity(0)
      const t = setTimeout(() => { setFadingOut(false); onFadeOutComplete?.() }, 800)
      return () => clearTimeout(t)
    }
  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

  // Canvas renders background + stars + central hub only (streams are now SVG)
  useEffect(() => {
    if (!visible && !fadingOut) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      setSize({ w: window.innerWidth, h: window.innerHeight })
    }
    resize()
    window.addEventListener('resize', resize)
    startTime.current = performance.now()

    const STAR_N = 280
    const sx = new Float32Array(STAR_N), sy = new Float32Array(STAR_N)
    const sr = new Float32Array(STAR_N), so = new Float32Array(STAR_N), sp = new Float32Array(STAR_N)
    for (let i = 0; i < STAR_N; i++) {
      sx[i] = Math.random(); sy[i] = Math.random()
      sr[i] = 0.3 + Math.random() * 1.3
      so[i] = 0.15 + Math.random() * 0.55
      sp[i] = Math.random() * Math.PI * 2
    }

    const animate = (time: number) => {
      const elapsed = (time - startTime.current) / 1000
      const w = canvas.width, h = canvas.height
      const cx = w / 2, cy = h / 2

      ctx.fillStyle = '#02010a'
      ctx.fillRect(0, 0, w, h)

      // Stars
      ctx.shadowBlur = 0
      for (let i = 0; i < STAR_N; i++) {
        ctx.globalAlpha = so[i] * (0.35 + 0.65 * Math.abs(Math.sin(elapsed * 1.1 + sp[i])))
        ctx.fillStyle = '#bdd4ff'
        ctx.beginPath()
        ctx.arc(sx[i] * w, sy[i] * h, sr[i], 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // Central hub
      const pulse = 0.88 + 0.12 * Math.sin(elapsed * 2.4)
      const hubR  = 95 * pulse
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, hubR)
      g.addColorStop(0,    'rgba(255,255,255,0.98)')
      g.addColorStop(0.05, 'rgba(215,185,255,0.75)')
      g.addColorStop(0.22, 'rgba(100,55,210,0.22)')
      g.addColorStop(0.55, 'rgba(40,18,100,0.06)')
      g.addColorStop(1,    'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, hubR, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowBlur  = 18
      ctx.shadowColor = '#ffffff'
      ctx.fillStyle   = '#ffffff'
      ctx.beginPath()
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      for (let r = 0; r < 4; r++) {
        const rr = (11 + r * 13) * pulse
        const ro = (0.45 - r * 0.09) * (0.45 + 0.55 * Math.sin(elapsed * 1.8 + r * 0.9))
        ctx.globalAlpha = ro
        ctx.strokeStyle = '#7744ee'
        ctx.lineWidth   = 0.7
        ctx.beginPath()
        ctx.arc(cx, cy, rr, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [visible, fadingOut])

  if (!visible && !fadingOut) return null

  const cx  = size.w / 2
  const cy  = size.h / 2
  const len = Math.min(size.w, size.h) * 0.46

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        opacity: overlayOpacity,
        transition: fadingOut ? 'opacity 0.8s ease-in-out' : 'none',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: DNA_CSS }} />

      {/* Canvas background (stars + hub) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width: '100vw', height: '100vh' }}
      />

      {/* DNA streams — pure SVG + CSS */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width="100%"
        height="100%"
        viewBox={`0 0 ${size.w} ${size.h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ zIndex: 1 }}
      >
        {STREAMS.map((s, i) => {
          const rad = (s.angle * Math.PI) / 180
          const ex  = cx + Math.cos(rad) * len
          const ey  = cy + Math.sin(rad) * len
          return (
            <DnaStream
              key={s.label}
              cx={cx} cy={cy} ex={ex} ey={ey}
              color={{ r: s.r, g: s.g, b: s.b }}
              index={i}
            />
          )
        })}
      </svg>

      {/* Stream labels */}
      {STREAMS.map(s => (
        <div
          key={s.label}
          className="absolute text-[11px] font-bold tracking-widest px-2 py-1 rounded border pointer-events-none select-none"
          style={{
            left: `${s.lx * 100}%`,
            top:  `${s.ly * 100}%`,
            transform: 'translate(-50%, -50%)',
            color:           `rgb(${s.r},${s.g},${s.b})`,
            borderColor:     `rgba(${s.r},${s.g},${s.b},0.45)`,
            backgroundColor: `rgba(${s.r},${s.g},${s.b},0.10)`,
            textShadow:      `0 0 12px rgb(${s.r},${s.g},${s.b})`,
            boxShadow:       `0 0 16px rgba(${s.r},${s.g},${s.b},0.18)`,
          }}
        >
          {s.label}
        </div>
      ))}

      {/* Status text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-3 mt-32">
          <p
            key={phraseIndex}
            className="text-2xl md:text-3xl font-bold text-white tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ textShadow: '0 0 40px rgba(168,85,247,0.9)' }}
          >
            {STATUS_PHRASES[phraseIndex]}
          </p>
          <p className="text-sm text-zinc-400 font-medium tracking-wide">
            Creative engine processing
          </p>
          <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  )
}
