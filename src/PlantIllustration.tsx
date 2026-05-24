import React from 'react'
import type { Plant } from './store'
import { getHydrationScale, getGrowthLevel } from './store'

interface Props {
  plant: Plant
  size?: number
}

// Interpolate leaf colour from wilted amber → fresh green
function leafColor(hydration: number): string {
  const h = Math.round(37 + (142 - 37) * hydration)
  const s = Math.round(91 + (69 - 91) * hydration)
  const l = Math.round(34 + (58 - 34) * hydration)
  return `hsl(${h}, ${s}%, ${l}%)`
}

const PlantIllustration = React.memo(function PlantIllustration({ plant, size = 200 }: Props) {
  const now = Date.now()
  const hydration = getHydrationScale(plant, now)
  const growth = getGrowthLevel(plant)

  const droopDeg = (1 - hydration) * 25
  const droopY = (1 - hydration) * 8

  // Stem height: 40–60% of SVG height based on growth
  const stemH = size * (0.40 + (growth / 100) * 0.20)

  // Leaf count based on growth
  const leafCount = growth >= 66 ? 4 : growth >= 33 ? 3 : 2

  const cx = size / 2
  const potTop = size * 0.70
  const stemBottom = potTop - size * 0.02
  const stemTop = stemBottom - stemH

  const color = leafColor(hydration)
  const stemWidth = Math.max(2, size * 0.022 + (growth / 100) * size * 0.01)

  const leaves = Array.from({ length: leafCount }, (_, i) => {
    const t = i / Math.max(leafCount - 1, 1)
    const y = stemBottom - stemH * (0.25 + t * 0.60)
    const side = i % 2 === 0 ? -1 : 1
    const rotateBase = side * 40
    const wilt = side * droopDeg
    return { y, side, rotateBase, wilt, droopY, opacity: 0.5 + (growth / 100) * 0.5 * ((i + 1) / leafCount) }
  })

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        ['--hydration' as string]: hydration,
        ['--growth' as string]: growth / 100,
      }}
      aria-label={`${plant.name} — ${Math.round(hydration * 100)}% hydrated, growth level ${Math.round(growth)}%`}
    >
      {/* Pot body */}
      <path
        d={`M ${cx - size * 0.19} ${potTop + size * 0.015}
            L ${cx - size * 0.15} ${potTop + size * 0.21}
            Q ${cx} ${potTop + size * 0.235} ${cx + size * 0.15} ${potTop + size * 0.21}
            L ${cx + size * 0.19} ${potTop + size * 0.015} Z`}
        fill="#78716c"
      />
      {/* Pot rim */}
      <ellipse cx={cx} cy={potTop + size * 0.015} rx={size * 0.20} ry={size * 0.036} fill="#a8a29e" />
      {/* Soil */}
      <ellipse cx={cx} cy={potTop + size * 0.018} rx={size * 0.162} ry={size * 0.026} fill="#57534e" />
      {/* Stem */}
      <line
        x1={cx} y1={stemBottom}
        x2={cx} y2={stemTop}
        stroke={color}
        strokeWidth={stemWidth}
        strokeLinecap="round"
      />
      {/* Leaves */}
      {leaves.map((leaf, i) => (
        <g
          key={i}
          transform={`translate(${cx},${leaf.y}) rotate(${leaf.rotateBase + leaf.wilt}) translate(0,${leaf.droopY})`}
          opacity={leaf.opacity}
          style={{ transition: 'all 1s ease' }}
        >
          <ellipse
            cx={leaf.side * size * 0.115}
            cy={-size * 0.042}
            rx={size * 0.105}
            ry={size * 0.058}
            fill={color}
          />
          {/* Leaf vein */}
          <line
            x1={0} y1={-size * 0.018}
            x2={leaf.side * size * 0.19}
            y2={-size * 0.048}
            stroke={color}
            strokeWidth={size * 0.008}
            strokeOpacity={0.4}
          />
        </g>
      ))}
      {/* Top bud */}
      {growth >= 10 && (
        <circle cx={cx} cy={stemTop} r={size * 0.028} fill={color} opacity={0.85} />
      )}
      {/* Wilting water drops when overdue */}
      {hydration < 0.2 && (
        <>
          <text x={cx - size * 0.15} y={size * 0.18} fontSize={size * 0.09} opacity={0.6}>💧</text>
          <text x={cx + size * 0.10} y={size * 0.12} fontSize={size * 0.07} opacity={0.4}>💧</text>
        </>
      )}
    </svg>
  )
})

export default PlantIllustration
