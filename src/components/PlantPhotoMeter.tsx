// PlantPhotoMeter — circular plant photo with an animated wave overlay
// rising to `hydration` × height. The thumbnail IS the meter.
//
// Used at 6 sizes across the app per HANDOFF.md:
//   48 home rows · 40 widget · 56 sheet identity · 68 already-watered ·
//   124 home featured · 148 plant detail · 180 NFC moment
//
// Two parallax wave layers travel in opposite directions (front 5s, back 7.5s).
// 6-stop gradient max-opacity 0.84 so the photo still shows through.
// On mount the fill rises 1.1s cubic-bezier(.22,.7,.18,1).

import React from 'react'
import { PCT, accentFor } from '../tokens'

interface Props {
  /** plant photo URL (absolute or /species/{id}.jpg relative path) */
  photo?: string
  /** alt text for the image */
  alt?: string
  /** 0..1 */
  hydration: number
  /** px */
  size?: number
  /** show the inset terracotta hairline */
  ring?: boolean
  /** bump to re-trigger the rise animation (e.g. after a watering) */
  animateKey?: string | number
}

const PlantPhotoMeter = React.memo(function PlantPhotoMeter({
  photo, alt = '', hydration, size = 80, ring = true, animateKey = 0,
}: Props) {
  const h = Math.max(0, Math.min(1, hydration))
  const accent = accentFor(h)
  const yFill = size - h * size
  const uid = React.useMemo(
    () => `ppm-${Math.random().toString(36).slice(2, 7)}-${animateKey}`,
    [animateKey],
  )

  const amp = Math.max(2, size * 0.04)
  const wavePath = buildWavePath(yFill, size, amp)
  const wavePathBack = buildWavePath(yFill + amp * 0.6, size, amp * 0.75)

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: ring ? `inset 0 0 0 1px ${PCT.terracottaDeep}44` : undefined,
        flexShrink: 0,
      }}
    >
      {/* gradient fallback */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${PCT.oliveSoft}, ${PCT.terracottaSoft})`,
        }}
      />
      {photo && (
        <img
          src={photo}
          alt={alt}
          loading="lazy"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {/* wave fill overlay */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        shapeRendering="geometricPrecision"
      >
        <defs>
          <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={accent} stopOpacity="0.26" />
            <stop offset="18%"  stopColor={accent} stopOpacity="0.48" />
            <stop offset="42%"  stopColor={accent} stopOpacity="0.62" />
            <stop offset="68%"  stopColor={accent} stopOpacity="0.74" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.84" />
          </linearGradient>
          <filter id={`${uid}-soft`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={Math.max(0.35, size * 0.005)} />
          </filter>
        </defs>
        <g filter={`url(#${uid}-soft)`}>
          {/* back wave — 7.5s, travels opposite direction */}
          <g
            style={{
              animation: `ppm-flow-back-${uid} 7.5s linear infinite`,
              willChange: 'transform',
            }}
          >
            <path d={wavePathBack} fill={accent} fillOpacity="0.22" />
          </g>
          {/* front wave — 5s */}
          <g
            style={{
              animation: `ppm-flow-front-${uid} 5s linear infinite`,
              willChange: 'transform',
            }}
          >
            <path d={wavePath} fill={`url(#${uid}-g)`} />
          </g>
        </g>
      </svg>

      {/* rim highlight + inner shadow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.55), inset 0 -1px 2px rgba(0,0,0,0.08)',
          pointerEvents: 'none',
        }}
      />

      <style>{`
        @keyframes ppm-flow-front-${uid} {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-${size}px, 0, 0); }
        }
        @keyframes ppm-flow-back-${uid} {
          from { transform: translate3d(-${size}px, 0, 0); }
          to   { transform: translate3d(0, 0, 0); }
        }
      `}</style>
    </div>
  )
})

// Build a wave path 3× the meter width so translating by 1× width loops seamlessly.
// Returns a closed path filling everything below the wave line.
function buildWavePath(yBase: number, size: number, amp: number): string {
  const peaks = 9 // 3 wavelengths × 3 widths
  const dx = (3 * size) / (peaks * 2)
  let d = `M ${-size} ${yBase}`
  let cx = -size
  for (let i = 0; i < peaks; i++) {
    d += ` Q ${cx + dx / 2} ${yBase - amp} ${cx + dx} ${yBase}`
    cx += dx
    d += ` Q ${cx + dx / 2} ${yBase + amp} ${cx + dx} ${yBase}`
    cx += dx
  }
  d += ` L ${cx} ${size + 20} L ${-size} ${size + 20} Z`
  return d
}

export default PlantPhotoMeter
export { buildWavePath }
