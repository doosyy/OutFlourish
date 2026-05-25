// WaterAllSheet — log a watering round for multiple plants at once.
// Shows all overdue/soon plants with checkboxes (pre-checked), each with
// their photo meter and recommended ml amount.

import { useState } from 'react'
import { useStore, type Plant } from '../store'
import { PCT, accentFor } from '../tokens'
import PlantPhotoMeter from '../components/PlantPhotoMeter'
import { BottomSheet } from '../components/UI'
import { DropGlyph } from '../components/Glyphs'

interface Props {
  plants: Plant[]
  onClose: () => void
}

export default function WaterAllSheet({ plants, onClose }: Props) {
  const { logWater } = useStore()

  // All plants pre-selected
  const [selected, setSelected] = useState<Set<string>>(new Set(plants.map(p => p.id)))
  const [saving, setSaving] = useState(false)

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const selectedCount = selected.size

  const handleLogAll = async () => {
    if (selectedCount === 0) return
    setSaving(true)
    const toWater = plants.filter(p => selected.has(p.id))
    await Promise.all(toWater.map(p => logWater(p.id, 'water', { amountMl: p.recommendedMl })))
    onClose()
  }

  const totalMl = plants
    .filter(p => selected.has(p.id))
    .reduce((sum, p) => sum + p.recommendedMl, 0)

  return (
    <BottomSheet onDismiss={onClose}>
      {/* Header */}
      <div className="mb-4.5">
        <div style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
          color: PCT.terracotta, marginBottom: 4,
        }}>Watering round</div>
        <div style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 28, lineHeight: 1.0, color: PCT.ink,
        }}>
          {plants.length} plant{plants.length !== 1 ? 's' : ''} need attention
        </div>
        <div className="mt-1" style={{
          fontFamily: 'Newsreader, Georgia, serif',
          fontStyle: 'italic', fontSize: 13, color: PCT.inkSoft,
        }}>
          Uncheck any you want to skip.
        </div>
      </div>

      {/* Plant list */}
      <div className="flex flex-col gap-2 mb-4">
        {plants.map(p => {
          const checked = selected.has(p.id)
          const hydration = 0 // show as empty — they need water
          const accent = accentFor(hydration)

          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className="flex items-center gap-3 text-left w-full"
              style={{
                padding: '12px 14px',
                borderRadius: 18,
                background: checked ? PCT.paper : PCT.cream,
                border: `1.5px solid ${checked ? PCT.terracotta + '30' : PCT.ink + '12'}`,
                opacity: checked ? 1 : 0.5,
                transition: 'all 0.15s ease',
              }}
            >
              {/* Checkbox */}
              <div style={{
                width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                background: checked ? PCT.terracotta : 'transparent',
                border: `1.5px solid ${checked ? PCT.terracotta : PCT.ink + '30'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}>
                {checked && (
                  <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                    <path d="M1 4L4 7L10 1" stroke={PCT.cream} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              {/* Meter */}
              <PlantPhotoMeter
                photo={p.photo}
                alt={p.species ?? p.name}
                hydration={hydration}
                size={48}
              />

              {/* Name + ml */}
              <div className="flex-1 min-w-0">
                <div style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: 19, lineHeight: 1.1, color: PCT.ink,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{p.name}</div>
                {p.species && (
                  <div style={{
                    fontFamily: '"DM Serif Display", Georgia, serif',
                    fontStyle: 'italic', fontSize: 12, color: PCT.inkSoft,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{p.species}</div>
                )}
              </div>

              {/* Amount */}
              <div className="flex-shrink-0 text-right">
                <div style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: 18, lineHeight: 1.0, color: accent,
                }}>{p.recommendedMl}</div>
                <div style={{
                  fontFamily: 'ui-monospace, "SF Mono", monospace',
                  fontSize: 9, color: PCT.inkFaint,
                }}>ml</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Total */}
      {selectedCount > 0 && (
        <div className="flex justify-between items-center mb-4 px-1">
          <span style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 14, color: PCT.inkFaint,
          }}>
            {selectedCount} plant{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <span style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 16, color: PCT.terracotta,
          }}>
            {totalMl} ml total
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2.5">
        <button
          onClick={onClose}
          className="flex-1 text-center"
          style={{
            padding: 15,
            background: 'transparent',
            border: `1px solid ${PCT.ink}22`,
            borderRadius: 18,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 17, color: PCT.inkSoft,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleLogAll}
          disabled={saving || selectedCount === 0}
          className="text-center disabled:opacity-40"
          style={{
            flex: 2,
            padding: 15,
            background: PCT.terracotta, color: PCT.cream,
            borderRadius: 18,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 18,
            boxShadow: selectedCount > 0 ? '0 8px 18px rgba(165,78,38,0.3)' : 'none',
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <DropGlyph color={PCT.cream} size={16} />
            {saving
              ? 'Logging…'
              : selectedCount === 0
              ? 'Select a plant'
              : `Log ${selectedCount} drink${selectedCount !== 1 ? 's' : ''}`}
          </span>
        </button>
      </div>
    </BottomSheet>
  )
}
