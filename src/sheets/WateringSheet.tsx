// WateringSheet — log a watering with a ml amount picker.
// Plant identity (56px meter) + big 84px ml display with ± steppers +
// small/medium/deep presets (60%/100%/130% of recommendedMl) + drainage tip
// + optional note + Cancel/Log actions.

import { useState } from 'react'
import { useStore, getHydrationScale, type Plant } from '../store'
import { PCT } from '../tokens'
import PlantPhotoMeter from '../components/PlantPhotoMeter'
import { BottomSheet } from '../components/UI'
import { DropGlyph } from '../components/Glyphs'

interface Props {
  plant: Plant
  onClose: () => void
  /** force initial ml; defaults to recommendedMl */
  initialMl?: number
}

export default function WateringSheet({ plant, onClose, initialMl }: Props) {
  const { logWater, rooms, settings } = useStore()
  const rec = plant.recommendedMl
  const presets = [
    { id: 'small',  label: 'Small',  ml: Math.round(rec * 0.6) },
    { id: 'medium', label: 'Medium', ml: rec },
    { id: 'deep',   label: 'Deep',   ml: Math.round(rec * 1.3) },
  ] as const
  const [amount, setAmount] = useState(initialMl ?? rec)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedPreset = presets.find(p => p.ml === amount)?.id

  const roomLight = rooms.find(r => r.name === plant.room)?.light
  const hydration = getHydrationScale(plant, {
    hemisphere: settings.season.hemisphere,
    lightAware: settings.rooms.lightAwareCare,
    roomLight,
  })

  const handleLog = async () => {
    setSaving(true)
    await logWater(plant.id, 'water', { amountMl: amount, note: note.trim() || undefined })
    onClose()
  }

  return (
    <BottomSheet onDismiss={onClose}>
      {/* Plant identity */}
      <div className="flex items-center gap-3.5 mb-4.5">
        <PlantPhotoMeter
          photo={plant.photo}
          alt={plant.species ?? plant.name}
          hydration={hydration}
          size={56}
        />
        <div className="flex-1 min-w-0">
          <div style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: PCT.terracotta, marginBottom: 2,
          }}>Logging a drink for</div>
          <div style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 26, lineHeight: 1.0, color: PCT.ink,
          }}>{plant.name}</div>
          {plant.species && (
            <div className="mt-0.5" style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 13, color: PCT.inkSoft,
            }}>{plant.species}</div>
          )}
        </div>
      </div>

      {/* Big stepper */}
      <div className="mb-3.5" style={{
        background: PCT.paper,
        border: `1px solid ${PCT.ink}10`,
        borderRadius: 22,
        padding: '20px 22px',
      }}>
        <div className="mb-2.5" style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: PCT.inkFaint,
        }}>How much water</div>
        <div className="flex items-center justify-between gap-4.5">
          <StepBtn onClick={() => setAmount(v => Math.max(10, v - 10))}>−</StepBtn>
          <div className="text-center">
            <div style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: 84, lineHeight: 0.85, color: PCT.terracotta,
              letterSpacing: '-0.04em',
            }}>{amount}</div>
            <div className="mt-1" style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 16, color: PCT.inkSoft,
            }}>millilitres</div>
          </div>
          <StepBtn onClick={() => setAmount(v => Math.min(2000, v + 10))}>+</StepBtn>
        </div>
        {/* Presets */}
        <div className="flex gap-2 mt-4">
          {presets.map(p => {
            const active = p.id === selectedPreset
            return (
              <button
                key={p.id}
                onClick={() => setAmount(p.ml)}
                className="flex-1 text-center"
                style={{
                  padding: '10px 8px',
                  borderRadius: 14,
                  background: active ? PCT.terracotta : PCT.cream,
                  color: active ? PCT.cream : PCT.ink,
                  border: `1px solid ${active ? PCT.terracotta : `${PCT.ink}18`}`,
                  boxShadow: active ? '0 4px 12px rgba(165,78,38,0.28)' : 'none',
                }}
              >
                <div style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontStyle: 'italic', fontSize: 15, lineHeight: 1.0,
                }}>{p.label}</div>
                <div className="mt-1" style={{
                  fontFamily: 'ui-monospace, "SF Mono", monospace',
                  fontSize: 10,
                  color: active ? PCT.terracottaSoft : PCT.inkFaint,
                }}>{p.ml} ml</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Drainage tip */}
      {settings.watering.drainageReminder && (
        <div className="flex gap-3 mb-3.5" style={{
          padding: '14px 18px',
          background: PCT.oliveSoft,
          borderRadius: 16,
        }}>
          <div className="flex-shrink-0 mt-0.5">
            <DropGlyph color={PCT.oliveDeep} size={16} />
          </div>
          <div>
            <div style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: 15, color: PCT.oliveDeep, lineHeight: 1.2,
            }}>Water steadily until you see drainage from the bottom.</div>
            <div className="mt-1" style={{
              fontFamily: 'Newsreader, Georgia, serif',
              fontSize: 12, color: PCT.inkSoft, lineHeight: 1.4,
            }}>
              Winter dose is ~{plant.winterMl} ml.
            </div>
          </div>
        </div>
      )}

      {/* Optional note */}
      <div className="mb-4.5" style={{
        padding: '14px 18px',
        background: PCT.paper,
        border: `1px solid ${PCT.ink}10`,
        borderRadius: 16,
      }}>
        <div className="mb-1.5" style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
          color: PCT.inkFaint,
        }}>Optional note</div>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Anything to remember?"
          className="w-full bg-transparent outline-none"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 16, color: PCT.ink,
          }}
        />
      </div>

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
          onClick={handleLog}
          disabled={saving}
          className="text-center disabled:opacity-50"
          style={{
            flex: 2,
            padding: 15,
            background: PCT.terracotta, color: PCT.cream,
            borderRadius: 18,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 18,
            boxShadow: '0 8px 18px rgba(165,78,38,0.3)',
          }}
        >
          {saving ? 'Logging…' : 'Log the drink'}
        </button>
      </div>
    </BottomSheet>
  )
}

function StepBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center flex-shrink-0"
      style={{
        width: 56, height: 56, borderRadius: '50%',
        background: PCT.cream,
        border: `1px solid ${PCT.ink}18`,
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: 28, color: PCT.terracottaDeep,
      }}
    >
      {children}
    </button>
  )
}
