'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ─── Keyframes ────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  @keyframes nl-breathe {
    0%,100% { transform: scale(0.97) rotate(-0.4deg); }
    50%      { transform: scale(1.03) rotate(0.4deg); }
  }
  @keyframes nl-node-pulse {
    0%,100% { opacity: 0.35; }
    50%      { opacity: 1; }
  }
  @keyframes nl-line-flicker {
    0%,100% { opacity: 0.08; }
    50%      { opacity: 0.5; }
  }
  @keyframes nl-particle-rise {
    0%   { transform: translate(0,0);    opacity: var(--op); }
    40%  { opacity: calc(var(--op)*1.3); }
    100% { transform: translate(var(--dx),var(--dy)); opacity: 0; }
  }
  @keyframes nl-glow-breathe {
    0%,100% { opacity: 0.35; transform: scale(1);    }
    50%      { opacity: 0.65; transform: scale(1.12); }
  }
  @keyframes nl-hud-left {
    from { opacity:0; transform:translateX(-24px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes nl-hud-right {
    from { opacity:0; transform:translateX(24px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes nl-hud-top {
    from { opacity:0; transform:translateY(-16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes nl-cursor {
    0%,100% { opacity:1; }
    50%      { opacity:0; }
  }
  @keyframes nl-bar-fill {
    0%   { width:0%; }
    100% { width:85%; }
  }
  @keyframes nl-exit {
    from { opacity:1; }
    to   { opacity:0; }
  }
  @keyframes nl-wave {
    0%,100% { transform: scaleY(1); }
    50%      { transform: scaleY(-1); }
  }
  @keyframes nl-scan {
    0%   { top: 0%; opacity: 0.6; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes nl-rotate-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`

// ─── Brain silhouette nodes — dense, realistic brain shape ───────────────────
const NODES: [number, number][] = [
  // Crown
  [200,28],[180,22],[220,24],[165,28],[235,30],[152,34],[248,36],
  // Upper left lobe outer
  [138,42],[122,50],[108,62],[96,76],[86,92],[80,108],[78,124],[80,140],[86,154],
  // Upper right lobe outer
  [262,42],[278,50],[292,62],[304,76],[314,92],[320,108],[322,124],[320,140],[314,154],
  // Left mid
  [76,168],[80,182],[88,194],[98,204],[110,212],[124,218],[138,222],
  // Right mid
  [324,168],[320,182],[312,194],[302,204],[290,212],[276,218],[262,222],
  // Bottom
  [200,228],[185,226],[215,226],[172,222],[228,222],[160,216],[240,216],
  // Inner left
  [148,56],[132,68],[120,82],[112,96],[108,112],[110,128],[116,142],[124,154],[134,164],
  // Inner right
  [252,56],[268,68],[280,82],[288,96],[292,112],[290,128],[284,142],[276,154],[266,164],
  // Center mass
  [200,50],[185,62],[215,62],[172,74],[228,74],[162,88],[238,88],
  [200,80],[188,94],[212,94],[178,108],[222,108],[200,110],
  [168,122],[232,122],[200,124],[185,136],[215,136],[200,140],
  [172,152],[228,152],[200,156],[185,168],[215,168],[200,172],
  [178,184],[222,184],[200,188],[188,200],[212,200],[200,204],
  // Cerebellum lower
  [152,196],[248,196],[160,206],[240,206],[172,212],[228,212],
  // Extra density
  [140,78],[260,78],[130,100],[270,100],[126,130],[274,130],
  [132,158],[268,158],[144,178],[256,178],
]

function buildConns(nodes: [number,number][], maxD: number): [number,number][] {
  const out: [number,number][] = []
  for (let i = 0; i < nodes.length; i++)
    for (let j = i+1; j < nodes.length; j++) {
      const dx = nodes[i][0]-nodes[j][0], dy = nodes[i][1]-nodes[j][1]
      if (dx*dx+dy*dy < maxD*maxD) out.push([i,j])
    }
  return out
}
const CONNS = buildConns(NODES, 58)

// ─── Particles ────────────────────────────────────────────────────────────────
interface P { id:number; x:number; y:number; s:number; op:number; dur:number; del:number; col:string; dx:number; dy:number }

const PARTICLE_COLORS = [
  '#ffffff','#ddf0ff','#aad8ff','#7EEEFF','#55ccff',
  '#88aaff','#aabbff','#ffd580','#ffcc44','#ffaa22',
]

function mkParticles(n: number): P[] {
  return Array.from({length:n},(_,i)=>({
    id: i,
    x: Math.random()*100,
    y: Math.random()*100,
    s: 0.8 + Math.random()*2.4,
    op: 0.15 + Math.random()*0.7,
    dur: 7 + Math.random()*14,
    del: -(Math.random()*16),
    col: i%9===0||i%13===0 ? PARTICLE_COLORS[7+Math.floor(Math.random()*3)]
       : PARTICLE_COLORS[Math.floor(Math.random()*6)],
    dx: (Math.random()-0.5)*40,
    dy: -(20 + Math.random()*80),
  }))
}

const MSGS = [
  'Analyzing YouTube topic...',
  'Building narrative arc...',
  'Generating script...',
  'Almost ready...',
]

// ─── Props ────────────────────────────────────────────────────────────────────
interface NeuralLoaderProps {
  onComplete?: () => void
  message?: string
  triggerComplete?: boolean
}

export function NeuralLoader({ onComplete, message, triggerComplete }: NeuralLoaderProps) {
  const [msgIdx, setMsgIdx] = useState(0)
  const [msgVis, setMsgVis] = useState(true)
  const [exiting, setExiting] = useState(false)
  const [gone, setGone] = useState(false)
  const [particles, setParticles] = useState<P[]>([])

  // Generate particles only on client to avoid hydration mismatch
  useEffect(() => {
    setParticles(mkParticles(220))
  }, [])

  useEffect(() => {
    if (message) return
    const iv = setInterval(() => {
      setMsgVis(false)
      setTimeout(() => { setMsgIdx(i=>(i+1)%MSGS.length); setMsgVis(true) }, 500)
    }, 2800)
    return () => clearInterval(iv)
  }, [message])

  const triggerExit = useCallback(() => {
    setExiting(true)
    setTimeout(() => { setGone(true); onComplete?.() }, 900)
  }, [onComplete])

  useEffect(() => { if (triggerComplete) triggerExit() }, [triggerComplete, triggerExit])

  if (gone) return null

  const msg = message ?? MSGS[msgIdx]

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: CSS}} />
      <div style={{
        position:'fixed', inset:0, zIndex:9999,
        background:'radial-gradient(ellipse at 50% 40%, #071428 0%, #030810 55%, #020608 100%)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        fontFamily:"'Space Mono','Courier Prime',monospace",
        overflow:'hidden',
        animation: exiting ? 'nl-exit 0.9s ease forwards' : undefined,
      }}>

        {/* ── Deep background gradient layers ── */}
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,60,140,0.25) 0%, transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 40% 30% at 30% 60%, rgba(60,0,140,0.12) 0%, transparent 60%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 40% 30% at 70% 40%, rgba(0,100,200,0.1) 0%, transparent 60%)',pointerEvents:'none'}}/>

        {/* ── Particles ── */}
        {particles.map(p=>(
          <div key={p.id} style={{
            position:'absolute',
            left:`${p.x}%`, top:`${p.y}%`,
            width:p.s, height:p.s,
            borderRadius:'50%',
            background:p.col,
            boxShadow: p.s > 2 ? `0 0 ${p.s*2}px ${p.col}` : undefined,
            ['--op' as string]: p.op,
            ['--dx' as string]: `${p.dx}px`,
            ['--dy' as string]: `${p.dy}px`,
            animation:`nl-particle-rise ${p.dur}s ${p.del}s ease-in infinite`,
            pointerEvents:'none',
          }}/>
        ))}

        {/* ── Outer ring glow ── */}
        <div style={{
          position:'absolute',
          width:560, height:480,
          borderRadius:'50%',
          background:'radial-gradient(ellipse, rgba(0,160,255,0.18) 0%, rgba(0,80,200,0.08) 40%, transparent 70%)',
          animation:'nl-glow-breathe 4s ease-in-out infinite',
          pointerEvents:'none',
        }}/>
        {/* secondary purple glow */}
        <div style={{
          position:'absolute',
          width:400, height:340,
          borderRadius:'50%',
          background:'radial-gradient(ellipse, rgba(80,0,200,0.1) 0%, transparent 65%)',
          animation:'nl-glow-breathe 5s 1s ease-in-out infinite',
          pointerEvents:'none',
        }}/>

        {/* ── Brain SVG ── */}
        <div style={{
          animation:'nl-breathe 4s ease-in-out infinite',
          position:'relative', zIndex:2,
          filter:'drop-shadow(0 0 32px rgba(0,180,255,0.5)) drop-shadow(0 0 80px rgba(0,100,255,0.25))',
        }}>
          <svg viewBox="60 10 280 230" width={480} height={390} style={{overflow:'visible'}}>
            <defs>
              <filter id="nl-lg" x="-120%" y="-120%" width="340%" height="340%">
                <feGaussianBlur stdDeviation="3.5" result="b"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0  0 0.7 1 0 0.3  0 0.9 1 0 0.5  0 0 0 1 0" in="b" result="c"/>
                <feMerge><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="nl-ng" x="-300%" y="-300%" width="700%" height="700%">
                <feGaussianBlur stdDeviation="4" result="b"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.2  0 0.8 1 0 0.4  0 0.9 1 0 0.6  0 0 0 1 0" in="b" result="c"/>
                <feMerge><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="nl-ng2" x="-300%" y="-300%" width="700%" height="700%">
                <feGaussianBlur stdDeviation="5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Connections */}
            {CONNS.map(([a,b],i)=>(
              <line key={i}
                x1={NODES[a][0]} y1={NODES[a][1]}
                x2={NODES[b][0]} y2={NODES[b][1]}
                stroke="#1ab8ff"
                strokeWidth={0.5 + (i%3)*0.2}
                filter="url(#nl-lg)"
                style={{animation:`nl-line-flicker ${2+(i%9)*0.28}s ${-(i%7)*0.35}s ease-in-out infinite`}}
              />
            ))}

            {/* Nodes — bright white core */}
            {NODES.map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r={i%4===0?3.5:2.5}
                fill={i%3===0?'#7EEEFF':i%5===0?'#aaddff':'#ffffff'}
                filter={i%4===0?'url(#nl-ng2)':'url(#nl-ng)'}
                style={{animation:`nl-node-pulse ${1.4+(i%7)*0.22}s ${-(i%9)*0.28}s ease-in-out infinite`}}
              />
            ))}
          </svg>
        </div>

        {/* ── HUD: top-left — NEURAL NETWORK / STATUS ── */}
        <Hud style={{top:'14%',left:'5%',animationName:'nl-hud-left',animationDelay:'0.1s'}}>
          <Row label="NEURAL NETWORK" bright/>
          <Row label="STATUS:" value="ACTIVE" valueColor="#39ff14"/>
          <div style={{marginTop:6,height:1,background:'rgba(0,200,255,0.2)'}}/>
          <Row label="UPTIME" value="00:00:08" dim/>
        </Hud>

        {/* ── HUD: top-right — small data panel ── */}
        <Hud style={{top:'14%',right:'5%',animationName:'nl-hud-right',animationDelay:'0.4s',minWidth:140}}>
          <Row label="FREQ" value="12.4 Hz" dim/>
          <Row label="SYNC" value="98.2%" valueColor="#7EEEFF"/>
          <div style={{marginTop:6,height:1,background:'rgba(0,200,255,0.2)'}}/>
          <Row label="MODE" value="DEEP" dim/>
        </Hud>

        {/* ── HUD: bottom-left — neurons + waveform ── */}
        <Hud style={{bottom:'16%',left:'5%',animationName:'nl-hud-left',animationDelay:'0.5s'}}>
          <Row label="190 NEURONS" bright/>
          <Row label="FIRING" value="0.8%" valueColor="#7EEEFF"/>
          <svg viewBox="0 0 80 20" width={120} height={28} style={{display:'block',marginTop:6}}>
            {/* animated heartbeat-style waveform */}
            {Array.from({length:8},(_,i)=>(
              <rect key={i} x={i*10+1} y={10-(3+Math.sin(i*1.3)*5)} width={2}
                height={6+Math.abs(Math.sin(i*1.3))*8}
                fill="#00E5FF" opacity={0.6+Math.sin(i)*0.3}
                style={{
                  transformOrigin:`${i*10+2}px 10px`,
                  animation:`nl-wave ${0.8+i*0.12}s ${-i*0.1}s ease-in-out infinite`,
                }}
              />
            ))}
          </svg>
        </Hud>

        {/* ── HUD: bottom-right — cluster data ── */}
        <Hud style={{bottom:'16%',right:'5%',animationName:'nl-hud-right',animationDelay:'0.7s'}}>
          <Row label="DATA CLUSTER ID:" bright/>
          <Row label="ALPHA-7" valueColor="#00E5FF"/>
          <div style={{marginTop:6,height:1,background:'rgba(0,200,255,0.2)'}}/>
          <Row label="SYNAPTIC ACTIVITY:"/>
          <Row label="STABLE" valueColor="#39ff14"/>
        </Hud>

        {/* ── Status message ── */}
        <div style={{
          position:'relative', zIndex:3, marginTop:16, textAlign:'center',
          opacity: msgVis ? 1 : 0,
          transition:'opacity 0.5s ease',
        }}>
          <span style={{color:'#7EEEFF',fontSize:13,letterSpacing:3,textTransform:'uppercase'}}>
            {msg}
          </span>
          <span style={{color:'#00E5FF',marginLeft:2,animation:'nl-cursor 1s step-end infinite'}}>_</span>
        </div>

        {/* ── Progress bar ── */}
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:'rgba(0,10,30,0.9)'}}>
          <div style={{
            height:'100%',
            background:'linear-gradient(90deg,#0055aa,#00aaff,#00E5FF)',
            boxShadow:'0 0 10px #00E5FF,0 0 20px rgba(0,229,255,0.5)',
            animation:'nl-bar-fill 8s cubic-bezier(0.05,0,0.25,1) forwards',
            position:'relative',
          }}>
            <div style={{
              position:'absolute',right:-1,top:-4,
              width:4,height:10,borderRadius:2,
              background:'#fff',
              boxShadow:'0 0 6px #00E5FF,0 0 14px #00E5FF',
            }}/>
          </div>
        </div>

      </div>
    </>
  )
}

// ─── HUD Panel ────────────────────────────────────────────────────────────────
function Hud({children,style}:{children:React.ReactNode;style?:React.CSSProperties}) {
  return (
    <div style={{
      position:'absolute',
      background:'rgba(0,12,40,0.65)',
      border:'1px solid rgba(0,180,255,0.28)',
      backdropFilter:'blur(10px)',
      WebkitBackdropFilter:'blur(10px)',
      borderRadius:5,
      padding:'10px 14px',
      minWidth:168,
      fontFamily:"'Space Mono','Courier Prime',monospace",
      animationDuration:'0.7s',
      animationTimingFunction:'cubic-bezier(0.22,1,0.36,1)',
      animationFillMode:'both',
      ...style,
    }}>
      {/* top accent line */}
      <div style={{position:'absolute',top:0,left:8,right:8,height:1,background:'linear-gradient(90deg,transparent,rgba(0,200,255,0.5),transparent)'}}/>
      {children}
    </div>
  )
}

function Row({label,value,valueColor,bright,dim}:{label:string;value?:string;valueColor?:string;bright?:boolean;dim?:boolean}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:2}}>
      <span style={{
        color: bright ? '#7EEEFF' : dim ? 'rgba(126,238,255,0.4)' : 'rgba(126,238,255,0.65)',
        fontSize:10, letterSpacing:1.5, whiteSpace:'nowrap',
      }}>{label}</span>
      {value && <span style={{color:valueColor??'rgba(126,238,255,0.65)',fontSize:10,letterSpacing:1,marginLeft:'auto'}}>{value}</span>}
    </div>
  )
}
