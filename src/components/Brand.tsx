// Brand assets — used by launch, onboarding, marketing, lock screen, etc.

import { PCT } from '../tokens'

interface BrandProps { size?: number; className?: string }

export function WateringCan({ size = 120, primary = 'cream', secondary = 'deep', className }:
  BrandProps & { primary?: 'cream' | 'terracotta' | string; secondary?: 'deep' | 'cream' | 'olive' | string }
) {
  const p = primary === 'cream' ? PCT.cream
    : primary === 'terracotta' ? PCT.terracotta
    : primary
  const s = secondary === 'deep' ? PCT.terracottaDeep
    : secondary === 'cream' ? PCT.cream
    : secondary === 'olive' ? PCT.oliveDeep
    : secondary
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className} style={{ display: 'block' }}>
      <ellipse cx="46" cy="82" rx="32" ry="3.5" fill={s} fillOpacity="0.15" />
      <path d="M26 40 Q26 18 48 18 Q60 18 60 28" fill="none" stroke={s} strokeWidth="3" strokeLinecap="round" />
      <path d="M20 40 H60 a6 6 0 0 1 6 6 v22 a10 10 0 0 1 -10 10 H22 a10 10 0 0 1 -10 -10 V46 a6 6 0 0 1 6 -6 z
              M20 40 L20 36 a3 3 0 0 1 3 -3 H53 a3 3 0 0 1 3 3 V40 Z"
        fill={p} stroke={s} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M20 40 H56" stroke={s} strokeWidth="1.4" />
      <path d="M66 50 L90 38 L92 44 L72 60" fill={p} stroke={s} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      <g fill={s}>
        <circle cx="86.5" cy="40" r="0.9" />
        <circle cx="88" cy="38" r="0.9" />
        <circle cx="84" cy="38" r="0.9" />
      </g>
      <path d="M92 53 c-1.6 3.5 -3.4 6.5 -3.4 9 a3.4 3.4 0 0 0 6.8 0 c0 -2.5 -1.8 -5.5 -3.4 -9z" fill={s} />
    </svg>
  )
}

export function Wordmark({ size = 44, color = 'ink', accent, className }:
  BrandProps & { color?: 'ink' | 'cream' | string; accent?: string }
) {
  const c = color === 'ink' ? PCT.ink : color === 'cream' ? PCT.cream : color
  const a = accent ?? PCT.terracottaDeep
  return (
    <div
      className={className}
      style={{
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1.0,
        color: c,
        letterSpacing: '-0.025em',
        whiteSpace: 'nowrap',
      }}
    >
      Out<span style={{ fontStyle: 'italic', color: a }}>Flourish</span>
    </div>
  )
}

export function AppIconMark({ size = 200, className }: BrandProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.225,
        background: `radial-gradient(circle at 30% 25%, ${PCT.terracotta} 0%, ${PCT.terracottaDeep} 70%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 ${size * 0.06}px ${size * 0.12}px rgba(58,30,18,0.28), inset 0 1px 1px rgba(255,255,255,0.18)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 80% 80%, rgba(0,0,0,0.18), transparent 60%)',
          opacity: 0.7,
        }}
      />
      <WateringCan size={size * 0.65} primary="cream" secondary="cream" />
    </div>
  )
}
