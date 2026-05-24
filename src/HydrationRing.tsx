import React from 'react'

interface Props {
  hydration: number          // 0..1
  size?: number              // px
  stroke?: number            // px
  burst?: boolean            // play a scale-burst animation
  children?: React.ReactNode // centred content (emoji, etc)
  showLabel?: boolean        // show "%" text when no children
}

function ringColor(h: number): string {
  if (h <= 0.001) return '#C25A4A'
  if (h < 0.25) return '#C25A4A'
  if (h < 0.55) return '#D4A574'
  return '#5F7D6B'
}

const HydrationRing = React.memo(function HydrationRing({
  hydration,
  size = 64,
  stroke = 5,
  burst = false,
  children,
  showLabel = false,
}: Props) {
  const clamped = Math.max(0, Math.min(1, hydration))
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * clamped
  const color = ringColor(clamped)

  return (
    <div
      className={`relative flex items-center justify-center ${burst ? 'animate-scale-burst' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90 absolute inset-0">
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth={stroke}
          fill="none"
          className="text-ink-900 dark:text-cream-50"
        />
        {/* progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{
            filter: `drop-shadow(0 0 4px ${color}55)`,
            transition: 'stroke-dasharray 0.9s cubic-bezier(0.32, 0.72, 0, 1), stroke 0.6s ease',
          }}
        />
      </svg>
      <div className="relative z-10 flex items-center justify-center">
        {children ?? (showLabel && (
          <span className="text-[10px] font-semibold tracking-tight text-ink-700 dark:text-cream-50/80 tabular-nums">
            {Math.round(clamped * 100)}%
          </span>
        ))}
      </div>
    </div>
  )
})

export default HydrationRing
