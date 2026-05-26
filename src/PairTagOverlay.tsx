// PairTagOverlay — full-screen instruction screen shown while NFC.writeNDEF is
// in flight. All visible content sits in the TOP half so it remains readable
// above the iOS Core NFC system sheet (which docks at the bottom and cannot
// be moved, restyled, or hidden).
//
// Lifecycle:
//   - On mount, fire writeNDEF with the plant's id encoded as an NDEF Text
//     record.
//   - iOS shows its own "Ready to Scan" modal at the bottom.
//   - User holds the sticker. iOS dismisses its modal and reports success
//     (or cancellation / failure) via the writeNDEF promise.
//   - We call onComplete(success). Parent handles persistence + navigation.

import { useEffect, useRef } from 'react'
import { NFC } from '@exxili/capacitor-nfc'
import { type Plant } from './store'
import { PCT } from './tokens'
import { NFCGlyph, LeafGlyph } from './components/Glyphs'

interface Props {
  plant: Plant
  /** Fires once when the iOS scan session settles (success or failure). */
  onComplete: (success: boolean) => void
}

export default function PairTagOverlay({ plant, onComplete }: Props) {
  // Guard against double-fire from React strict mode / re-mounts.
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    let cancelled = false

    async function go() {
      try {
        // NDEF Well Known Text record: status byte (lang-code length) +
        // 'en' + plant id (e.g. 'plant_1716629192988').
        const langCode = 'en'
        const text = plant.id
        const status = langCode.length & 0x3f
        const encoder = new TextEncoder()
        const payload = [status, ...encoder.encode(langCode), ...encoder.encode(text)]
        await NFC.writeNDEF({ records: [{ type: 'T', payload }], rawMode: true })
        if (!cancelled) onComplete(true)
      } catch (err) {
        console.warn('[PairTagOverlay] writeNDEF failed:', err)
        if (!cancelled) onComplete(false)
      }
    }

    go()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plant.id])

  return (
    <div
      className="fixed inset-0 z-[140]"
      style={{
        background: PCT.cream,
        backgroundImage: `
          radial-gradient(circle at 50% 12%, ${PCT.terracottaSoft}cc, transparent 55%),
          radial-gradient(circle at 50% 50%, ${PCT.oliveSoft}55, transparent 60%)
        `,
        paddingTop: 'max(56px, var(--sat))',
        color: PCT.ink,
      }}
    >
      <style>{pulseCss}</style>

      <div className="px-7" style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Kicker */}
        <div style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
          color: PCT.terracotta, marginTop: 8,
        }}>
          Pairing a sticker
        </div>

        {/* Plant identity */}
        <div className="flex items-center gap-3.5 mt-3">
          <div className="flex-shrink-0" style={{
            width: 56, height: 56, borderRadius: 18, overflow: 'hidden',
            background: `linear-gradient(135deg, ${PCT.oliveSoft}, ${PCT.terracottaSoft})`,
            border: `1px solid ${PCT.ink}14`,
          }}>
            {plant.photo
              ? <img
                  src={plant.photo}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              : <div className="flex items-center justify-center w-full h-full">
                  <LeafGlyph color={PCT.terracottaDeep} size={22} />
                </div>}
          </div>
          <div className="flex-1 min-w-0">
            <div style={{
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: PCT.inkFaint, marginBottom: 2,
            }}>
              Writing this tag for
            </div>
            <div style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 26, lineHeight: 1.05, color: PCT.ink,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {plant.name}
            </div>
          </div>
        </div>

        {/* Big instruction */}
        <h1 className="mt-7" style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 38, lineHeight: 1.05, fontWeight: 400,
          letterSpacing: '-0.025em', color: PCT.ink,
          margin: 0,
        }}>
          Hold the sticker to the<br />
          <span style={{ fontStyle: 'italic', color: PCT.terracottaDeep }}>back of your phone.</span>
        </h1>

        <p className="mt-4" style={{
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 15, lineHeight: 1.5, color: PCT.inkSoft,
          margin: 0,
        }}>
          iOS will show its own scan prompt at the bottom. Keep the sticker steady; you will feel a small tap when it links.
        </p>

        {/* Pulsing NFC waves */}
        <div className="flex justify-center mt-12" style={{ position: 'relative', height: 140 }}>
          <div className="pair-pulse-ring" style={{ borderColor: PCT.terracotta + '44' }} />
          <div className="pair-pulse-ring pair-pulse-ring--delay" style={{ borderColor: PCT.terracotta + '33' }} />
          <div className="pair-pulse-ring pair-pulse-ring--delay-2" style={{ borderColor: PCT.terracotta + '22' }} />
          <div className="flex items-center justify-center" style={{
            width: 88, height: 88, borderRadius: '50%',
            background: PCT.terracotta,
            boxShadow: '0 18px 36px rgba(165,78,38,0.32)',
            position: 'relative', zIndex: 2,
          }}>
            <NFCGlyph color={PCT.cream} size={36} />
          </div>
        </div>
      </div>
    </div>
  )
}

const pulseCss = `
.pair-pulse-ring {
  position: absolute;
  top: 50%; left: 50%;
  width: 88px; height: 88px;
  margin-top: -44px; margin-left: -44px;
  border-radius: 50%;
  border: 1.5px solid;
  opacity: 0;
  animation: pair-pulse 2.6s ease-out infinite;
}
.pair-pulse-ring--delay { animation-delay: 0.85s; }
.pair-pulse-ring--delay-2 { animation-delay: 1.7s; }

@keyframes pair-pulse {
  0%   { transform: scale(1);   opacity: 0.7; }
  80%  { transform: scale(2.6); opacity: 0; }
  100% { transform: scale(2.6); opacity: 0; }
}
`
