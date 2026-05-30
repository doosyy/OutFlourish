// BlankTagSheet — appears when a blank NFC tag is held to the phone.
// Two modes:
//   1. Chooser: "Pair to an existing plant" vs "Add a new plant"
//   2. Picker:  scroll list of plants. Tapping one closes the sheet and
//               hands the selected plant up to the parent, which then
//               opens PairTagOverlay (a full-screen instruction view)
//               and triggers NFC.writeNDEF from there.

import { useState } from 'react'
import { type Plant } from '../store'
import { PCT } from '../tokens'
import { BottomSheet } from '../components/UI'
import { NFCGlyph, PlusGlyph, LeafGlyph, ChevronGlyph } from '../components/Glyphs'

interface Props {
  plants: Plant[]
  /** Why the chooser opened: 'blank' = unwritten tag; 'unknown' = a tag whose
   *  plant_id no longer matches any plant. Only changes the eyebrow label. */
  kind?: 'blank' | 'unknown'
  /** Fired when the user picks a plant to pair. Parent should close the
   *  sheet and open PairTagOverlay with this plant. */
  onPairExisting: (plant: Plant) => void
  onCreateNew: () => void
  onCancel: () => void
}

export default function BlankTagSheet({ plants, kind = 'blank', onPairExisting, onCreateNew, onCancel }: Props) {
  const [mode, setMode] = useState<'choose' | 'pick'>('choose')

  const handlePick = (plant: Plant) => {
    onPairExisting(plant)
  }

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
          }}>{kind === 'unknown' ? 'An unknown tag' : 'A blank tag'}</div>
          <div style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 22, lineHeight: 1.1, color: PCT.ink,
          }}>
            {mode === 'choose' ? 'What\'s this sticker for?' : 'Which plant gets the tag?'}
          </div>
        </div>
      </div>

      {mode === 'choose' && (
        <>
          <button
            onClick={() => setMode('pick')}
            disabled={plants.length === 0}
            className="w-full flex items-center gap-3 text-left mb-2.5 disabled:opacity-40"
            style={{
              padding: '16px 18px',
              background: PCT.paper,
              border: `1px solid ${PCT.ink}14`,
              borderRadius: 18,
            }}
          >
            <LeafGlyph color={PCT.terracottaDeep} size={20} />
            <div className="flex-1">
              <div style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: 18, lineHeight: 1.1, color: PCT.ink,
              }}>Pair to an existing plant</div>
              <div className="mt-0.5" style={{
                fontFamily: 'Newsreader, Georgia, serif',
                fontSize: 13, color: PCT.inkSoft, lineHeight: 1.35,
              }}>
                {plants.length === 0 ? 'No plants yet.' : `Pick from your ${plants.length} plant${plants.length === 1 ? '' : 's'}.`}
              </div>
            </div>
            <ChevronGlyph color={PCT.inkFaint} size={16} direction="right" />
          </button>

          <button
            onClick={onCreateNew}
            className="w-full flex items-center gap-3 text-left mb-4"
            style={{
              padding: '16px 18px',
              background: PCT.paper,
              border: `1px solid ${PCT.ink}14`,
              borderRadius: 18,
            }}
          >
            <PlusGlyph color={PCT.terracottaDeep} size={20} />
            <div className="flex-1">
              <div style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: 18, lineHeight: 1.1, color: PCT.ink,
              }}>Add a new plant</div>
              <div className="mt-0.5" style={{
                fontFamily: 'Newsreader, Georgia, serif',
                fontSize: 13, color: PCT.inkSoft, lineHeight: 1.35,
              }}>Search the library, pair this tag after saving.</div>
            </div>
            <ChevronGlyph color={PCT.inkFaint} size={16} direction="right" />
          </button>

          <button
            onClick={onCancel}
            className="w-full text-center"
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
        </>
      )}

      {mode === 'pick' && (
        <>
          <div style={{
            maxHeight: 320,
            overflowY: 'auto',
            background: PCT.paper,
            border: `1px solid ${PCT.ink}14`,
            borderRadius: 18,
            marginBottom: 14,
          }}>
            {plants.map((p, i) => (
              <button
                key={p.id}
                onClick={() => handlePick(p)}
                className="w-full flex items-center gap-3 text-left"
                style={{
                  padding: '12px 16px',
                  background: 'transparent',
                  borderTop: i === 0 ? 'none' : `1px solid ${PCT.ink}10`,
                }}
              >
                <div className="flex-shrink-0" style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: `linear-gradient(135deg, ${PCT.oliveSoft}, ${PCT.terracottaSoft})`,
                  overflow: 'hidden',
                }}>
                  {p.photo && (
                    <img src={p.photo} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{
                    fontFamily: '"DM Serif Display", Georgia, serif',
                    fontSize: 17, lineHeight: 1.1, color: PCT.ink,
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
                {p.nfcTagId && (
                  <span style={{
                    fontFamily: 'ui-monospace, "SF Mono", monospace',
                    fontSize: 9, letterSpacing: 1.3, color: PCT.inkFaint,
                    textTransform: 'uppercase',
                  }}>paired</span>
                )}
                <span style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontStyle: 'italic', fontSize: 13, color: PCT.inkFaint,
                }}>pair →</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => setMode('choose')}
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
              Back
            </button>
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
          </div>
        </>
      )}
    </BottomSheet>
  )
}
