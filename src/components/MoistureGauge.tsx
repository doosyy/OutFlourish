// MoistureGauge — a vertical "beaker" gauge + numeric readout. Used on Plant
// Detail in place of a second plant portrait: the moisture reading reads as an
// instrument, not a duplicated photo. Reusable anywhere a moisture level is
// shown without a photo.
//
// The beaker fills bottom→`hydration` using the same two-layer parallax wave
// technique as PlantPhotoMeter (front 5s, back 7.5s), tinted by accentFor().

import React from 'react'
import { PCT, accentFor } from '../tokens'
import { getMoistureLabel } from '../store'

interface Props {
  /** 0..1 */
  hydration: number
  /** e.g. "9 days ago" — rendered as "Last drink {label}." */
  lastWateredLabel?: string
}

// Wave fill for an arbitrary rectangle. Path is 3× the width so a 1× translate
// loops seamlessly. yBase sits at the fill line; the path closes below it.
function rectWavePath(w: number, h: number, level: number, ampMul = 0.07): string {
  const yBase = h - Math.max(0, Math.min(1, level)) * h
  const amp = Math.max(2, w * ampMul)
  const peaks = 6
  const dx = (3 * w) / (peaks * 2)
  let d = `M ${-w} ${yBase}`
  let cx = -w
  for (let i = 0; i < peaks; i++) {
    d += ` Q ${cx + dx / 2} ${yBase - amp} ${cx + dx} ${yBase}`; cx += dx
    d += ` Q ${cx + dx / 2} ${yBase + amp} ${cx + dx} ${yBase}`; cx += dx
  }
  d += ` L ${cx} ${h + 10} L ${-w} ${h + 10} Z`
  return d
}

const W = 60
const H = 116

export default function MoistureGauge({ hydration, lastWateredLabel }: Props) {
  const h = Math.max(0, Math.min(1, hydration))
  const accent = accentFor(h)
  const uid = React.useMemo(() => `mg-${Math.random().toString(36).slice(2, 7)}`, [])
  const front = rectWavePath(W, H, h, 0.07)
  const back = rectWavePath(W, H, h - 0.015, 0.05)

  return (
    <div
      className="flex items-stretch"
      style={{
        gap: 16,
        padding: 16,
        background: 'rgba(255,255,255,0.55)',
        border: `1px solid ${PCT.ink}10`,
        borderRadius: 22,
      }}
    >
      {/* Beaker */}
      <div
        style={{
          width: W, height: H, borderRadius: 16, overflow: 'hidden',
          position: 'relative', flexShrink: 0,
          background: PCT.cream,
          boxShadow: `inset 0 0 0 1px ${PCT.ink}12, inset 0 2px 5px rgba(58,30,18,0.06)`,
        }}
      >
        <svg
          width={W} height={H} viewBox={`0 0 ${W} ${H}`}
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
          shapeRendering="geometricPrecision"
        >
          <defs>
            <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.92" />
            </linearGradient>
          </defs>
          <g style={{ animation: `mg-back-${uid} 7.5s linear infinite`, willChange: 'transform' }}>
            <path d={back} fill={accent} fillOpacity="0.3" />
          </g>
          <g style={{ animation: `mg-front-${uid} 5s linear infinite`, willChange: 'transform' }}>
            <path d={front} fill={`url(#${uid}-g)`} />
          </g>
        </svg>
        {/* tick marks */}
        {[0.25, 0.5, 0.75].map(t => (
          <div key={t} style={{
            position: 'absolute', left: 0, right: 0,
            top: `${(1 - t) * 100}%`, height: 1, background: `${PCT.ink}12`,
          }} />
        ))}
        <style>{`
          @keyframes mg-front-${uid} {
            from { transform: translate3d(0,0,0); }
            to   { transform: translate3d(-${W}px,0,0); }
          }
          @keyframes mg-back-${uid} {
            from { transform: translate3d(-${W}px,0,0); }
            to   { transform: translate3d(0,0,0); }
          }
        `}</style>
      </div>

      {/* Readout */}
      <div className="flex-1 flex flex-col justify-center">
        <div style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: PCT.inkFaint, marginBottom: 6,
        }}>Soil moisture</div>
        <div className="flex items-baseline" style={{ gap: 8 }}>
          <span style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 52, lineHeight: 0.8, color: accent,
          }}>{Math.round(h * 100)}</span>
          <span style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 22, color: accent,
          }}>%</span>
        </div>
        <div style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 18, color: PCT.ink, marginTop: 6,
        }}>{getMoistureLabel(h)}</div>
        {lastWateredLabel && (
          <div style={{
            fontFamily: 'Newsreader, Georgia, serif',
            fontSize: 12.5, color: PCT.inkSoft, marginTop: 4,
          }}>Last drink {lastWateredLabel}.</div>
        )}
      </div>
    </div>
  )
}
