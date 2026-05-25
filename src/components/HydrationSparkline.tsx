// HydrationSparkline — 30-day moisture chart with watering dots.
// Used on Plant Detail. Hydration decays linearly between waterings, snapping
// back to 1.0 at each drink.

import { useMemo } from 'react'
import { PCT, accentFor } from '../tokens'
import type { Plant } from '../store'
import { getLastWatered } from '../store'

interface Props {
  plant: Plant
  width?: number
  height?: number
  accent?: string
  /** override now() for testing */
  now?: number
  /** override effective interval (e.g. apply room light + season). default = baseIntervalDays */
  intervalDays?: number
}

export default function HydrationSparkline({
  plant, width = 340, height = 90, accent, now = Date.now(), intervalDays,
}: Props) {
  const series = useMemo(
    () => buildSeries(plant, now, intervalDays ?? plant.baseIntervalDays),
    [plant, now, intervalDays],
  )
  const currentH = series[series.length - 1].h
  const fill = accent ?? accentFor(currentH)

  const pad = 12
  const w = width - pad * 2
  const h = height - pad * 2
  const n = series.length
  const x = (i: number) => pad + (i / (n - 1)) * w
  const y = (v: number) => pad + (1 - v) * h

  const path = series.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.h)}`).join(' ')
  const area = `${path} L ${x(n - 1)} ${pad + h} L ${x(0)} ${pad + h} Z`

  // Watering dots within the 30-day window
  const days = 30
  const lastWatered = getLastWatered(plant)
  const dotsData = plant.history
    .filter(e => e.type === 'water')
    .map(e => ({ daysAgo: Math.floor((now - e.timestamp) / 86_400_000) }))
    .filter(d => d.daysAgo >= 0 && d.daysAgo <= days)
  // series[0] is day 30 ago, series[n-1] is today (0 days ago)
  const dots = dotsData.map(d => ({ x: x(days - d.daysAgo), y: y(1.0) }))

  // Pulsing "today" dot (only meaningful if there's any history)
  const hasHistory = lastWatered !== null
  const uid = useMemo(() => `spark-${plant.id}`, [plant.id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={fill} stopOpacity="0.4" />
            <stop offset="1" stopColor={fill} stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* threshold lines */}
        <line x1={pad} y1={y(0.5)} x2={pad + w} y2={y(0.5)}
          stroke={PCT.ink} strokeOpacity="0.07" strokeDasharray="2 4" />
        <line x1={pad} y1={y(0.25)} x2={pad + w} y2={y(0.25)}
          stroke={PCT.thirsty} strokeOpacity="0.15" strokeDasharray="2 4" />

        {/* area + line */}
        <path d={area} fill={`url(#${uid})`} />
        <path d={path} fill="none" stroke={fill} strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* today marker */}
        <line x1={x(n - 1)} y1={pad} x2={x(n - 1)} y2={pad + h}
          stroke={PCT.ink} strokeOpacity="0.25" strokeWidth="1" />

        {/* watering dots */}
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r="3.5"
            fill={PCT.cream} stroke={PCT.terracottaDeep} strokeWidth="1.2" />
        ))}

        {/* current value dot + pulse */}
        {hasHistory && (
          <>
            <circle cx={x(n - 1)} cy={y(currentH)} r="4" fill={fill} />
            <circle cx={x(n - 1)} cy={y(currentH)} r="4" fill={fill} opacity="0.4">
              <animate attributeName="r" values="4;10;4" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="1.8s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </svg>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: `0 ${pad}px`,
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 9,
          letterSpacing: 1.4,
          color: PCT.inkFaint,
          textTransform: 'uppercase',
        }}
      >
        <span>30 days ago</span>
        <span>·</span>
        <span>watered ◯</span>
        <span>·</span>
        <span>today</span>
      </div>
    </div>
  )
}

interface SeriesPoint { d: number; h: number }

/**
 * Build a 31-point hydration trajectory (today + last 30 days).
 * Hydration decays linearly 1 → 0 over `intervalDays` from each watering.
 */
function buildSeries(plant: Plant, now: number, intervalDays: number): SeriesPoint[] {
  const days = 30
  const series: SeriesPoint[] = []
  const waterings = plant.history
    .filter(e => e.type === 'water')
    .map(e => Math.floor((now - e.timestamp) / 86_400_000)) // days ago
    .filter(d => d >= 0)
    .sort((a, b) => a - b) // ascending = most recent first

  for (let d = days; d >= 0; d--) {
    // d = days ago. find most recent watering at-or-before this day (waterDaysAgo >= d).
    const lastWatering = waterings.find(w => w >= d)
    if (lastWatering === undefined) {
      // no watering yet — early hydration tapers up gently from -0.2 to 0.4
      series.push({ d, h: Math.max(0, 0.4 - (d - days) * 0.02) })
    } else {
      const daysSince = lastWatering - d
      const h = Math.max(0, 1 - daysSince / Math.max(1, intervalDays))
      series.push({ d, h })
    }
  }
  return series
}
