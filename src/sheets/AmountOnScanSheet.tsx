// AmountOnScanSheet — fast amount picker that appears on a paired NFC scan.
// Three preset chips (Light / Recommended / Heavy) + a Custom toggle that
// reveals an inline stepper. Tapping Continue triggers the NFC moment
// animation with the chosen amount.
//
// Light    = winterMl (small drink)
// Default  = recommendedMl
// Heavy    = round(recommendedMl × 1.4) (deep soak)

import { useState } from 'react'
import { type Plant } from '../store'
import { PCT } from '../tokens'
import { BottomSheet } from '../components/UI'
import { NFCGlyph } from '../components/Glyphs'

interface Props {
  plant: Plant
  onContinue: (amountMl: number) => void
  onCancel: () => void
}

export default function AmountOnScanSheet({ plant, onContinue, onCancel }: Props) {
  const rec = plant.recommendedMl
  const light = plant.winterMl
  const heavy = Math.round(rec * 1.4)
  const presets = [
    { id: 'light',  label: 'Light',       ml: light, hint: 'Winter dose' },
    { id: 'rec',    label: 'Recommended', ml: rec,   hint: 'Usual drink' },
    { id: 'heavy',  label: 'Heavy',       ml: heavy, hint: 'Deep soak'  },
  ] as const
  const [amount, setAmount] = useState(rec)
  const [customOpen, setCustomOpen] = useState(false)

  const selectedPreset = presets.find(p => p.ml === amount && !customOpen)?.id

  return (
    <BottomSheet onDismiss={onCancel}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center flex-shrink-0" style={{
          width: 44, height: 44, borderRadius: '50%',
          background: PCT.terracottaSoft,
        }}>
          <NFCGlyph color={PCT.terracottaDeep} size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: PCT.terracotta, marginBottom: 2,
          }}>Tag scanned</div>
          <div style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 22, lineHeight: 1.05, color: PCT.ink,
          }}>
            How much for <span style={{ fontStyle: 'italic' }}>{plant.name}?</span>
          </div>
        </div>
      </div>

      {/* Preset chips */}
      <div className="flex gap-2 mb-3">
        {presets.map(p => {
          const active = p.id === selectedPreset
          return (
            <button
              key={p.id}
              onClick={() => { setAmount(p.ml); setCustomOpen(false) }}
              className="flex-1 text-center"
              style={{
                padding: '14px 8px',
                borderRadius: 16,
                background: active ? PCT.terracotta : PCT.paper,
                color: active ? PCT.cream : PCT.ink,
                border: `1px solid ${active ? PCT.terracotta : `${PCT.ink}14`}`,
                boxShadow: active ? '0 6px 14px rgba(165,78,38,0.26)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontStyle: 'italic', fontSize: 17, lineHeight: 1.0,
              }}>{p.label}</div>
              <div className="mt-1" style={{
                fontFamily: 'ui-monospace, "SF Mono", monospace',
                fontSize: 11,
                color: active ? PCT.terracottaSoft : PCT.inkFaint,
              }}>{p.ml} ml</div>
              <div className="mt-0.5" style={{
                fontFamily: 'Newsreader, Georgia, serif',
                fontSize: 11,
                color: active ? PCT.cream + 'cc' : PCT.inkFaint,
              }}>{p.hint}</div>
            </button>
          )
        })}
      </div>

      {/* Custom toggle / stepper */}
      {!customOpen ? (
        <button
          onClick={() => setCustomOpen(true)}
          className="w-full text-center mb-4"
          style={{
            padding: '10px',
            background: 'transparent',
            border: `1px dashed ${PCT.ink}26`,
            borderRadius: 14,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 14, color: PCT.inkSoft,
          }}
        >
          Custom amount…
        </button>
      ) : (
        <div className="mb-4" style={{
          background: PCT.paper,
          border: `1px solid ${PCT.ink}14`,
          borderRadius: 18,
          padding: '14px 18px',
        }}>
          <div className="mb-1.5" style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: PCT.inkFaint,
          }}>Custom amount</div>
          <div className="flex items-center justify-between gap-3">
            <StepBtn onClick={() => setAmount(v => Math.max(10, v - 10))}>−</StepBtn>
            <div className="text-center flex-1">
              <span style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: 44, lineHeight: 0.9, color: PCT.terracotta,
                letterSpacing: '-0.03em',
              }}>{amount}</span>
              <span className="ml-1.5" style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontStyle: 'italic', fontSize: 14, color: PCT.inkSoft,
              }}>ml</span>
            </div>
            <StepBtn onClick={() => setAmount(v => Math.min(2000, v + 10))}>+</StepBtn>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2.5">
        <button
          onClick={onCancel}
          className="flex-1 text-center"
          style={{
            padding: 14,
            background: 'transparent',
            border: `1px solid ${PCT.ink}22`,
            borderRadius: 18,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 16, color: PCT.inkSoft,
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onContinue(amount)}
          className="text-center"
          style={{
            flex: 2,
            padding: 14,
            background: PCT.terracotta, color: PCT.cream,
            borderRadius: 18,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 17,
            boxShadow: '0 8px 18px rgba(165,78,38,0.3)',
          }}
        >
          Pour {amount} ml
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
        width: 44, height: 44, borderRadius: '50%',
        background: PCT.cream,
        border: `1px solid ${PCT.ink}18`,
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: 24, color: PCT.terracottaDeep,
      }}
    >
      {children}
    </button>
  )
}
