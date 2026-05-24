// MoistureMeter — the photo-less variant of PlantPhotoMeter.
// A circular vessel with the same wave physics, used in design-system docs,
// the onboarding illustration, and the empty room "suggested species" tiles.
//
// MoistureBar — a thin horizontal strip variant for dense list rows.

import React from 'react'
import { PCT, accentFor } from '../tokens'
import { buildWavePath } from './PlantPhotoMeter'

interface MeterProps {
  value: number     // 0..1
  size?: number
  accent?: string   // override
  label?: string
  compact?: boolean
  animateKey?: string | number
}

export const MoistureMeter = React.memo(function MoistureMeter({
  value, size = 120, accent, label, compact = false, animateKey = 0,
}: MeterProps) {
  const v = Math.max(0, Math.min(1, value))
  const fillColor = accent ?? accentFor(v)
  const yFill = (1 - v) * size
  const uid = React.useMemo(
    () => `mm-${Math.random().toString(36).slice(2, 7)}-${animateKey}`,
    [animateKey],
  )

  const wavePath = buildWavePath(yFill, size, 4)
  const wavePathBack = buildWavePath(yFill + 2.5, size, 3)

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: compact ? 0 : 6,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        shapeRendering="geometricPrecision"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <clipPath id={`${uid}-clip`}>
            <circle cx={size / 2} cy={size / 2} r={size / 2 - 1} />
          </clipPath>
          <linearGradient id={`${uid}-grad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={fillColor} stopOpacity="0.22" />
            <stop offset="15%"  stopColor={fillColor} stopOpacity="0.42" />
            <stop offset="35%"  stopColor={fillColor} stopOpacity="0.58" />
            <stop offset="60%"  stopColor={fillColor} stopOpacity="0.74" />
            <stop offset="85%"  stopColor={fillColor} stopOpacity="0.86" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.92" />
          </linearGradient>
          <filter id={`${uid}-soft`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
        </defs>

        {/* vessel */}
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 1}
          fill="rgba(0,0,0,0.04)" stroke={PCT.terracottaDeep} strokeOpacity="0.35" strokeWidth="1" />

        {/* fill */}
        <g clipPath={`url(#${uid}-clip)`}>
          <g style={{
            animation: `mm-rise-${uid} 1100ms cubic-bezier(.22,.7,.18,1) both`,
            willChange: 'transform',
          }}>
            <g filter={`url(#${uid}-soft)`}>
              <g style={{ animation: `mm-flow-back-${uid} 7.5s linear infinite`, willChange: 'transform' }}>
                <path d={wavePathBack} fill={fillColor} fillOpacity="0.26" />
              </g>
              <g style={{ animation: `mm-flow-front-${uid} 5s linear infinite`, willChange: 'transform' }}>
                <path d={wavePath} fill={`url(#${uid}-grad)`} />
              </g>
            </g>
          </g>
        </g>

        {/* rim highlight */}
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 1}
          fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1"
          style={{ mixBlendMode: 'overlay' }} />

        <style>{`
          @keyframes mm-rise-${uid} {
            from { transform: translateY(${size * 0.4}px); opacity: 0.6; }
            to   { transform: translateY(0); opacity: 1; }
          }
          @keyframes mm-flow-front-${uid} {
            from { transform: translate3d(0, 0, 0); }
            to   { transform: translate3d(-${size}px, 0, 0); }
          }
          @keyframes mm-flow-back-${uid} {
            from { transform: translate3d(-${size}px, 0, 0); }
            to   { transform: translate3d(0, 0, 0); }
          }
        `}</style>
      </svg>
      {label && !compact && (
        <div style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 14,
          fontStyle: 'italic',
          color: PCT.inkSoft,
          letterSpacing: 0.2,
        }}>
          {label}
        </div>
      )}
    </div>
  )
})

interface BarProps {
  value: number       // 0..1
  accent?: string
  width?: string | number
  height?: number
  className?: string
}

export function MoistureBar({ value, accent, width = '100%', height = 4, className }: BarProps) {
  const v = Math.max(0, Math.min(1, value))
  const fillColor = accent ?? accentFor(v)
  return (
    <div
      className={className}
      style={{
        width, height,
        borderRadius: 999,
        background: 'rgba(0,0,0,0.07)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute', inset: 0,
          width: `${Math.max(3, v * 100)}%`,
          background: `linear-gradient(90deg, ${fillColor}aa, ${fillColor})`,
          borderRadius: 999,
          transition: 'width 0.9s cubic-bezier(0.32, 0.72, 0, 1), background 0.6s ease',
        }}
      />
    </div>
  )
}
