'use client'

const NODES = 10
const BASE_PERIOD = 1.8

const COLORS_A = [
  '#e879f9',
  '#c084fc',
  '#818cf8',
  '#60a5fa',
  '#22d3ee',
  '#34d399',
  '#86efac',
  '#bef264',
  '#fbbf24',
  '#fb923c',
]

const COLORS_B = [
  '#f43f5e',
  '#f97316',
  '#fbbf24',
  '#84cc16',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#d946ef',
  '#ec4899',
]

const CSS = `
  @keyframes dna-strand-a {
    0%, 100% { transform: translateX(23px) scale(1.4); opacity: 1; }
    25%       { transform: translateX(6px)  scale(1.08); opacity: 0.78; }
    50%       { transform: translateX(-23px) scale(0.55); opacity: 0.18; }
    75%       { transform: translateX(6px)  scale(1.08); opacity: 0.78; }
  }
  @keyframes dna-strand-b {
    0%, 100% { transform: translateX(-23px) scale(0.55); opacity: 0.18; }
    25%       { transform: translateX(-6px)  scale(1.08); opacity: 0.78; }
    50%       { transform: translateX(23px)  scale(1.4);  opacity: 1; }
    75%       { transform: translateX(-6px)  scale(1.08); opacity: 0.78; }
  }
  @keyframes dna-rung {
    0%, 50%, 100% { transform: scaleX(1);    opacity: 0.6; }
    25%, 75%      { transform: scaleX(0.03); opacity: 0; }
  }
  @keyframes dna-y-bob {
    0%, 100% { transform: translateY(0px); }
    38%      { transform: translateY(-3px); }
    72%      { transform: translateY(2.5px); }
  }
  @keyframes dna-float {
    0%, 100% { transform: translateY(0px)  rotate(0deg)   scale(1); }
    30%      { transform: translateY(-7px) rotate(0.7deg) scale(1.015); }
    65%      { transform: translateY(6px)  rotate(-0.7deg) scale(0.985); }
  }
  @keyframes dna-hue-spin {
    from { filter: hue-rotate(0deg); }
    to   { filter: hue-rotate(360deg); }
  }
`

export function DnaLoader() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div style={{ animation: 'dna-float 4.2s ease-in-out infinite' }}>
        <div style={{ animation: 'dna-hue-spin 8s linear infinite' }}>
          <svg
            viewBox="0 0 80 215"
            width="66"
            height="178"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <filter id="dna-glow" x="-130%" y="-130%" width="360%" height="360%">
                <feGaussianBlur stdDeviation="3.2" result="blur" />
                <feColorMatrix type="saturate" values="2" in="blur" result="vivid" />
                <feMerge>
                  <feMergeNode in="vivid" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {Array.from({ length: NODES }, (_, i) => {
              const cy = 15 + i * 20
              const f = i / NODES
              const period = BASE_PERIOD + (i % 4) * 0.07
              const yPeriod = period * 1.35 + (i % 3) * 0.18
              const dA  = `${(-f * period).toFixed(3)}s`
              const dB  = `${(-(((f + 0.5) % 1) * period)).toFixed(3)}s`
              const dR  = `${(-f * (period / 2)).toFixed(3)}s`
              const dYA = `${(-f * yPeriod * 0.65).toFixed(3)}s`
              const dYB = `${(-(((f + 0.5) % 1) * yPeriod * 0.65)).toFixed(3)}s`
              const cA  = COLORS_A[i]
              const cB  = COLORS_B[i]
              const rungPeriod = (period / 2).toFixed(3)

              return (
                <g key={i}>
                  {/* Rung */}
                  <line
                    x1="5" y1={cy} x2="75" y2={cy}
                    stroke={cA}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    style={{
                      transformBox: 'fill-box',
                      transformOrigin: 'center',
                      animation: `dna-rung ${rungPeriod}s ease-in-out infinite`,
                      animationDelay: dR,
                    }}
                  />

                  {/* Node A — outer group handles Y-bob */}
                  <g style={{
                    animation: `dna-y-bob ${yPeriod.toFixed(3)}s ease-in-out infinite`,
                    animationDelay: dYA,
                  }}>
                    <circle
                      cx="40" cy={cy} r="5.5"
                      fill={cA}
                      filter="url(#dna-glow)"
                      style={{
                        transformBox: 'fill-box',
                        transformOrigin: 'center',
                        animation: `dna-strand-a ${period.toFixed(3)}s ease-in-out infinite`,
                        animationDelay: dA,
                      }}
                    />
                  </g>

                  {/* Node B — outer group handles Y-bob */}
                  <g style={{
                    animation: `dna-y-bob ${(yPeriod * 1.07).toFixed(3)}s ease-in-out infinite`,
                    animationDelay: dYB,
                  }}>
                    <circle
                      cx="40" cy={cy} r="5.5"
                      fill={cB}
                      filter="url(#dna-glow)"
                      style={{
                        transformBox: 'fill-box',
                        transformOrigin: 'center',
                        animation: `dna-strand-b ${period.toFixed(3)}s ease-in-out infinite`,
                        animationDelay: dB,
                      }}
                    />
                  </g>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </>
  )
}
