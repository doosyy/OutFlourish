// NfcMoment — the signature animation. 6.5s cycle, full-screen takeover,
// auto-dismisses after the 'done' phase. Logs the watering during the
// 'watering' phase (~2.6s in).
//
// Phases:
//   0.0–1.4s   Listening   — silhouette + ripple rings + "Hold steady"
//   1.4–2.6s   Reveal      — silhouette fades to plant photo
//   2.6–4.4s   Watering    — droplets fall, meter ring fills
//   4.4–6.5s   Confirmed   — check badge + "Watered just now"

import { useEffect } from 'react'
import { useStore, type Plant } from './store'
import { PCT } from './tokens'
import { NFCGlyph, DropGlyph, CheckGlyph } from './components/Glyphs'

interface Props {
  plant: Plant
  /** called when the user dismisses early or animation completes */
  onComplete: () => void
  /** When true, suppress the real logWater side-effect (used by Settings preview). */
  previewMode?: boolean
}

const TOTAL_MS = 6500

export default function NfcMoment({ plant, onComplete, previewMode = false }: Props) {
  const { logWater } = useStore()

  useEffect(() => {
    // Trigger the actual watering during the 'watering' phase (skipped in preview)
    const waterTimer = previewMode ? null : setTimeout(() => {
      logWater(plant.id, 'water', { amountMl: plant.recommendedMl })
    }, 2600)
    // Auto-dismiss when the full cycle finishes
    const dismissTimer = setTimeout(onComplete, TOTAL_MS)
    return () => {
      if (waterTimer) clearTimeout(waterTimer)
      clearTimeout(dismissTimer)
    }
  }, [plant.id, plant.recommendedMl, logWater, onComplete, previewMode])

  return (
    <div
      className="fixed inset-0 z-[150] flex flex-col"
      style={{
        background: PCT.cream,
        backgroundImage: `
          radial-gradient(circle at 50% 18%, ${PCT.terracottaSoft}cc, transparent 55%),
          radial-gradient(circle at 50% 100%, ${PCT.oliveSoft}66, transparent 55%)
        `,
        paddingTop: 'max(56px, var(--sat))',
        overflow: 'hidden',
        fontFamily: 'Newsreader, Georgia, serif',
        color: PCT.ink,
      }}
    >
      <style>{nfcCss}</style>

      {/* Phase kicker */}
      <div className="text-center" style={{ padding: '24px 32px 0' }}>
        <PhaseLine phase="listening">· Hold steady ·</PhaseLine>
        <PhaseLine phase="reveal" color={PCT.terracotta}>· Tag found ·</PhaseLine>
        <PhaseLine phase="watering" color={PCT.olive}>· Watering ·</PhaseLine>
        <PhaseLine phase="done" color={PCT.olive}>· Watered just now ·</PhaseLine>
      </div>

      {/* Centerpiece */}
      <div className="relative flex items-center justify-center" style={{ height: 440 }}>
        {/* Ripple rings */}
        <div className="nfc-rings absolute inset-0 flex items-center justify-center">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="nfc-ring" style={{ animationDelay: `${i * 0.4}s` }} />
          ))}
        </div>

        {/* Droplets */}
        <div className="nfc-droplets absolute" style={{ left: 0, right: 0, top: 60, bottom: 0, pointerEvents: 'none' }}>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="nfc-drop absolute top-0" style={{
              left: `${20 + i * 9}%`,
              animationDelay: `${2.6 + i * 0.08}s`,
            }}>
              <DropGlyph color={PCT.terracottaDeep} size={14} />
            </div>
          ))}
        </div>

        {/* Stage */}
        <div className="nfc-stage relative" style={{ width: 200, height: 200, zIndex: 5 }}>
          {/* Outer ring + filling arc */}
          <svg width="200" height="200" viewBox="0 0 200 200" className="absolute inset-0">
            <circle cx="100" cy="100" r="96" fill="none" stroke={PCT.terracottaDeep} strokeOpacity="0.25" strokeWidth="1" />
            <circle cx="100" cy="100" r="86" fill="none" stroke={PCT.terracottaDeep} strokeOpacity="0.18" strokeWidth="1" strokeDasharray="2 4" />
            <circle
              className="nfc-meter-arc"
              cx="100" cy="100" r="91"
              fill="none" stroke={PCT.olive} strokeWidth="3" strokeLinecap="round"
              strokeDasharray="572" strokeDashoffset="572"
              transform="rotate(-90 100 100)"
            />
          </svg>

          {/* Silhouette */}
          <div className="nfc-silhouette absolute flex items-center justify-center" style={{
            inset: 18, borderRadius: '50%',
            background: `linear-gradient(135deg, ${PCT.paperDeep}, ${PCT.paper})`,
            boxShadow: `inset 0 0 0 2px ${PCT.cream}, inset 0 0 24px rgba(0,0,0,0.05)`,
            overflow: 'hidden',
          }}>
            <div style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic',
              fontSize: 78,
              color: `${PCT.ink}22`,
            }}>?</div>
          </div>

          {/* Photo (revealed) */}
          <div className="nfc-photo absolute" style={{
            inset: 18, borderRadius: '50%', overflow: 'hidden',
            boxShadow: `inset 0 0 0 2px ${PCT.cream}`,
          }}>
            <div className="absolute inset-0" style={{
              background: `linear-gradient(135deg, ${PCT.oliveSoft}, ${PCT.terracottaSoft})`,
            }} />
            {plant.photo && (
              <img
                src={plant.photo}
                alt={plant.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            )}
            {/* Wave fill overlay (rises during watering phase) */}
            <div className="nfc-wave absolute left-0 right-0 bottom-0" style={{
              height: '100%',
              background: `linear-gradient(180deg, transparent 0%, ${PCT.olive}cc 18%, ${PCT.oliveDeep}ee 100%)`,
              pointerEvents: 'none',
            }} />
          </div>

          {/* NFC symbol (listening phase) */}
          <div className="nfc-symbol absolute inset-0 flex items-center justify-center" style={{ zIndex: 6 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(255,251,243,0.92)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: `inset 0 0 0 1px ${PCT.terracotta}44, 0 12px 30px rgba(165,78,38,0.18)`,
              }}
            >
              <NFCGlyph color={PCT.terracottaDeep} size={28} />
            </div>
          </div>

          {/* Reveal burst */}
          <div className="nfc-burst absolute" style={{
            inset: -20, borderRadius: '50%',
            border: `2px solid ${PCT.terracotta}`,
            opacity: 0,
          }} />
        </div>
      </div>

      {/* Name + species (revealed) */}
      <div className="nfc-name-wrap text-center" style={{ padding: '12px 32px 0' }}>
        <h1 style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 52, lineHeight: 1.0, fontWeight: 400,
          margin: 0, color: PCT.ink, letterSpacing: '-0.025em',
        }}>{plant.name}</h1>
        {plant.species && (
          <div className="mt-1" style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 18, color: PCT.terracottaDeep,
          }}>
            {plant.species}{plant.room ? ` · ${plant.room}` : ''}
          </div>
        )}
      </div>

      {/* Listening placeholder name */}
      <div className="nfc-listening-name absolute text-center" style={{
        left: 0, right: 0, top: 458,
        padding: '12px 32px 0',
      }}>
        <h1 style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic',
          fontSize: 36, lineHeight: 1.0, fontWeight: 400,
          margin: 0, color: PCT.inkFaint, letterSpacing: '-0.025em',
        }}>Awaiting a tag…</h1>
      </div>

      {/* Status card */}
      <div className="absolute" style={{ left: 22, right: 22, bottom: 56 }}>
        <div
          className="nfc-card relative overflow-hidden flex items-center gap-4"
          style={{
            background: PCT.ink, color: PCT.cream,
            padding: '18px 22px',
            borderRadius: 22,
            boxShadow: '0 18px 36px rgba(58,30,18,0.32)',
            minHeight: 80,
          }}
        >
          <div className="flex-1 relative">
            <CardLine phase="listening" kicker="Listening" kickerColor={PCT.terracottaSoft}>
              Hold steady. The plant is judging your aim.
            </CardLine>
            <CardLine phase="reveal" kicker={`Hello, ${plant.name}`} kickerColor={PCT.terracottaSoft}>
              {plant.species ? `${plant.species}, identified.` : 'Identified.'}
            </CardLine>
            <CardLine phase="watering" kicker="Watering" kickerColor={PCT.terracottaSoft}>
              {plant.name} is drinking it in, gratefully.
            </CardLine>
            <CardLine phase="done" kicker={`Logged · ${plant.recommendedMl} ml`} kickerColor={PCT.oliveSoft}>
              {plant.name} is feeling smug. Next sip soon.
            </CardLine>
          </div>
          <div className="nfc-check flex items-center justify-center flex-shrink-0" style={{
            width: 44, height: 44, borderRadius: '50%',
            background: PCT.olive, opacity: 0,
          }}>
            <CheckGlyph color={PCT.cream} size={22} />
          </div>
        </div>
      </div>

      {/* Tap-anywhere-to-skip overlay (invisible) */}
      <button
        onClick={onComplete}
        className="absolute inset-0 z-0 cursor-default"
        style={{ background: 'transparent' }}
        aria-label="Skip"
      />
    </div>
  )
}

function PhaseLine({ phase, children, color }: { phase: string; children: React.ReactNode; color?: string }) {
  return (
    <div className={`nfc-text nfc-text-${phase} inline-block`} style={{
      fontFamily: 'ui-monospace, "SF Mono", monospace',
      fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase',
      color: color ?? PCT.terracotta,
      marginBottom: 8,
      marginTop: phase === 'listening' ? 0 : -22,
    }}>{children}</div>
  )
}

function CardLine({ phase, kicker, kickerColor, children }: {
  phase: string; kicker: string; kickerColor: string; children: React.ReactNode
}) {
  return (
    <div className={`nfc-card-line nfc-card-${phase} absolute`} style={{ inset: '0 0 0 0' }}>
      <div style={{
        fontFamily: 'ui-monospace, "SF Mono", monospace',
        fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase',
        color: kickerColor, marginBottom: 4,
      }}>{kicker}</div>
      <div style={{
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: 19, fontStyle: 'italic', color: PCT.cream,
      }}>{children}</div>
    </div>
  )
}

// All keyframes inline for self-containment. 6.5s total cycle.
const nfcCss = `
@keyframes nfc-ring-pulse {
  0%   { transform: scale(0.3); opacity: 0; }
  10%  { opacity: 0.6; }
  100% { transform: scale(1); opacity: 0; }
}
@keyframes nfc-rings-visible {
  0%, 19%   { opacity: 1; }
  23%, 100% { opacity: 0; }
}
@keyframes nfc-drop-fall {
  0%, 40%   { opacity: 0; transform: translateY(-80px) scale(0.6); }
  45%       { opacity: 1; transform: translateY(0) scale(1); }
  65%       { opacity: 1; transform: translateY(110px) scale(0.8); }
  70%, 100% { opacity: 0; transform: translateY(110px) scale(0.4); }
}
@keyframes nfc-meter-fill {
  0%, 40%   { stroke-dashoffset: 572; }
  68%       { stroke-dashoffset: 0; }
  100%      { stroke-dashoffset: 0; }
}
@keyframes nfc-wave-rise {
  0%, 40%  { transform: translateY(100%); }
  68%      { transform: translateY(8%); }
  100%     { transform: translateY(8%); }
}
@keyframes nfc-silhouette-out {
  0%, 21.5% { opacity: 1; transform: scale(1); }
  26%, 100% { opacity: 0; transform: scale(0.92); }
}
@keyframes nfc-photo-in {
  0%, 21.5% { opacity: 0; transform: scale(0.88); }
  30%       { opacity: 1; transform: scale(1.02); }
  34%, 100% { opacity: 1; transform: scale(1); }
}
@keyframes nfc-symbol-fade {
  0%, 19%   { opacity: 1; transform: scale(1); }
  24%, 100% { opacity: 0; transform: scale(0.6); }
}
@keyframes nfc-burst {
  0%, 21.5% { opacity: 0; transform: scale(0.7); }
  24%       { opacity: 1; transform: scale(1.0); }
  32%       { opacity: 0; transform: scale(1.4); }
  100%      { opacity: 0; transform: scale(1.4); }
}
@keyframes nfc-check-in {
  0%, 68%   { opacity: 0; transform: scale(0); }
  76%       { opacity: 1; transform: scale(1.15); }
  82%, 100% { opacity: 1; transform: scale(1); }
}
@keyframes nfc-name-in {
  0%, 21.5% { opacity: 0; transform: translateY(8px); }
  30%       { opacity: 1; transform: translateY(0); }
  100%      { opacity: 1; transform: translateY(0); }
}
@keyframes nfc-listening-name {
  0%, 19%   { opacity: 1; transform: translateY(0); }
  24%, 100% { opacity: 0; transform: translateY(-6px); }
}
@keyframes nfc-text-listening { 0%, 19%   { opacity: 1; } 24%, 100% { opacity: 0; } }
@keyframes nfc-text-reveal    { 0%, 21.5% { opacity: 0; } 26%, 38%  { opacity: 1; } 42%, 100% { opacity: 0; } }
@keyframes nfc-text-watering  { 0%, 40%   { opacity: 0; } 45%, 65%  { opacity: 1; } 70%, 100% { opacity: 0; } }
@keyframes nfc-text-done      { 0%, 68%   { opacity: 0; } 76%, 100% { opacity: 1; } }

@keyframes nfc-card-listening { 0%, 19%   { opacity: 1; transform: translateY(0); } 23%, 100% { opacity: 0; transform: translateY(-6px); } }
@keyframes nfc-card-reveal    { 0%, 21.5% { opacity: 0; transform: translateY(6px); } 26%, 38% { opacity: 1; transform: translateY(0); } 42%, 100% { opacity: 0; transform: translateY(-6px); } }
@keyframes nfc-card-watering  { 0%, 40%   { opacity: 0; transform: translateY(6px); } 45%, 65% { opacity: 1; transform: translateY(0); } 70%, 100% { opacity: 0; transform: translateY(-6px); } }
@keyframes nfc-card-done      { 0%, 68%   { opacity: 0; transform: translateY(6px); } 76%, 100% { opacity: 1; transform: translateY(0); } }

.nfc-rings { animation: nfc-rings-visible 6.5s ease-in-out both; }
.nfc-ring {
  position: absolute;
  width: 240px; height: 240px;
  border-radius: 50%;
  border: 1px solid ${PCT.terracotta};
  animation: nfc-ring-pulse 1.6s ease-out infinite;
  opacity: 0;
}
.nfc-drop { animation: nfc-drop-fall 6.5s ease-in both; opacity: 0; }
.nfc-meter-arc { animation: nfc-meter-fill 6.5s ease-in-out both; }
.nfc-wave { animation: nfc-wave-rise 6.5s ease-in-out both; transform: translateY(100%); }

.nfc-silhouette { animation: nfc-silhouette-out 6.5s ease-in-out both; }
.nfc-photo      { animation: nfc-photo-in 6.5s ease-out both; opacity: 0; }

.nfc-symbol { animation: nfc-symbol-fade 6.5s ease-in-out both; }
.nfc-burst  { animation: nfc-burst 6.5s ease-out both; }
.nfc-check  { animation: nfc-check-in 6.5s ease-out both; opacity: 0; }

.nfc-name-wrap      { animation: nfc-name-in 6.5s ease-out both; opacity: 0; }
.nfc-listening-name { animation: nfc-listening-name 6.5s ease-in-out both; }

.nfc-text-listening { animation: nfc-text-listening 6.5s ease-in-out both; }
.nfc-text-reveal    { animation: nfc-text-reveal 6.5s ease-in-out both;    opacity: 0; }
.nfc-text-watering  { animation: nfc-text-watering 6.5s ease-in-out both;  opacity: 0; }
.nfc-text-done      { animation: nfc-text-done 6.5s ease-out both;         opacity: 0; }

.nfc-card-listening { animation: nfc-card-listening 6.5s ease-in-out both; }
.nfc-card-reveal    { animation: nfc-card-reveal 6.5s ease-in-out both;    opacity: 0; }
.nfc-card-watering  { animation: nfc-card-watering 6.5s ease-in-out both;  opacity: 0; }
.nfc-card-done      { animation: nfc-card-done 6.5s ease-out both;         opacity: 0; }
`
