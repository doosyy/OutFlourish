// LaunchScreen + Onboarding — 4 steps now (Welcome → NFC story → Region picker → Add first plant).
// Rendered as a full-screen overlay until settings.onboardingComplete = true.

import { useState } from 'react'
import { type Hemisphere } from './store'
import { PCT } from './tokens'
import { Wordmark, AppIconMark } from './components/Brand'
import { NFCGlyph } from './components/Glyphs'

type Step = 0 | 1 | 2 | 3

interface Props {
  onFinish: (opts: { hemisphere: Hemisphere; region: string }) => void
}

const REGIONS: Array<{ label: string; hemisphere: Hemisphere; region: string }> = [
  { label: 'Melbourne, AU',  hemisphere: 'Southern', region: 'Melbourne, AU' },
  { label: 'Sydney, AU',     hemisphere: 'Southern', region: 'Sydney, AU' },
  { label: 'Auckland, NZ',   hemisphere: 'Southern', region: 'Auckland, NZ' },
  { label: 'London, UK',     hemisphere: 'Northern', region: 'London, UK' },
  { label: 'New York, US',   hemisphere: 'Northern', region: 'New York, US' },
  { label: 'Berlin, DE',     hemisphere: 'Northern', region: 'Berlin, DE' },
]

export default function Onboarding({ onFinish }: Props) {
  const [step, setStep] = useState<Step>(0)
  const [region, setRegion] = useState(REGIONS[0])

  const handleNext = () => {
    if (step === 3) {
      onFinish({ hemisphere: region.hemisphere, region: region.region })
    } else {
      setStep(s => (s + 1) as Step)
    }
  }
  const handleSkip = () => onFinish({ hemisphere: region.hemisphere, region: region.region })

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center"
      style={{
        background: PCT.cream,
        backgroundImage: `
          radial-gradient(circle at 10% 6%, ${PCT.terracottaSoft}66, transparent 38%),
          radial-gradient(circle at 100% 95%, ${PCT.oliveSoft}55, transparent 40%)
        `,
        paddingTop: 'max(56px, var(--sat))',
        paddingBottom: 'max(56px, var(--sab))',
        fontFamily: 'Newsreader, Georgia, serif',
      }}
    >
      {/* Top — wordmark + skip */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-5.5"
        style={{ top: 'max(56px, var(--sat))' }}
      >
        <Wordmark size={20} />
        <button onClick={handleSkip} style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 14, color: PCT.inkFaint,
        }}>Skip</button>
      </div>

      <div
        className="flex-1 flex flex-col items-center px-7 text-center overflow-y-auto w-full"
        style={{
          paddingTop: step === 2 ? 56 : 0,
          paddingBottom: 12,
          justifyContent: step === 2 ? 'flex-start' : 'center',
        }}
      >
        {step === 0 && <Step0 />}
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 region={region} onChange={setRegion} />}
        {step === 3 && <Step3 />}
      </div>

      {/* Progress dots + CTA */}
      <div className="flex flex-col items-center gap-5.5 px-5.5 w-full" style={{ maxWidth: 480 }}>
        <div className="flex gap-2.5 items-center">
          {[0, 1, 2, 3].map(i => (
            <span key={i} style={{
              width: i === step ? 24 : 6,
              height: 6,
              borderRadius: 999,
              background: i === step ? PCT.terracotta : `${PCT.ink}22`,
              transition: 'width 0.3s',
            }} />
          ))}
        </div>
        <button
          onClick={handleNext}
          className="inline-flex items-center justify-center gap-2.5"
          style={{
            padding: '15px 36px',
            background: PCT.terracotta,
            color: PCT.cream,
            borderRadius: 999,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 18,
            boxShadow: '0 12px 28px rgba(165,78,38,0.32)',
            minWidth: 200,
          }}
        >
          {step === 0 ? 'Begin' : step === 1 ? 'Continue' : step === 2 ? 'Sounds right' : 'Add my first plant'}
          <span style={{ fontStyle: 'normal' }}>→</span>
        </button>
        {step === 3 && (
          <button style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 14, color: PCT.inkFaint,
          }}>or scan a tag to begin</button>
        )}
      </div>
    </div>
  )
}

function Step0() {
  return (
    <>
      <AppIconMark size={120} />
      <div className="mt-9 text-center">
        <div className="mb-3" style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
          color: PCT.terracotta,
        }}>· hello ·</div>
        <h1 style={{
          margin: 0,
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 44, lineHeight: 1.0, fontWeight: 400,
          letterSpacing: '-0.025em', color: PCT.ink,
        }}>
          Welcome to<br />
          <span style={{ color: PCT.terracotta }}>Out</span>
          <span style={{ fontStyle: 'italic', color: PCT.terracottaDeep }}>Flourish</span>
          <span style={{ color: PCT.terracotta }}>.</span>
        </h1>
        <p className="mx-auto mt-5.5" style={{
          maxWidth: 320,
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 16, lineHeight: 1.5, color: PCT.inkSoft,
        }}>
          A quiet little app for a thirsty little household.
          We'll learn your plants by their rhythm, and nudge you only
          when one of them needs you.
        </p>
      </div>
    </>
  )
}

function Step1() {
  return (
    <>
      <div className="relative" style={{ width: 220, height: 220 }}>
        {/* Phone */}
        <div className="absolute" style={{ left: 0, top: 30, width: 86, height: 160 }}>
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: PCT.ink,
              color: PCT.cream,
              padding: 8,
              borderRadius: 18,
              boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
            }}
          >
            <div className="w-full h-full flex items-center justify-center" style={{
              background: PCT.cream, borderRadius: 12,
            }}>
              <NFCGlyph color={PCT.terracotta} size={32} />
            </div>
          </div>
        </div>
        {/* Waves */}
        <div className="absolute flex gap-1" style={{ left: 88, top: 100 }}>
          {[0, 1, 2].map(i => (
            <span key={i} className="animate-nfc-pulse" style={{
              width: 10, height: 10, borderRadius: '50%',
              background: PCT.terracotta,
              opacity: 0.3 + i * 0.2,
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </div>
        {/* Pot with tag */}
        <div className="absolute" style={{ right: 0, top: 30, width: 130, height: 160 }}>
          <svg width="130" height="160" viewBox="0 0 130 160" fill="none">
            <ellipse cx="65" cy="148" rx="40" ry="5" fill={PCT.terracottaDeep} fillOpacity="0.18" />
            <path d="M30 90 h70 l-7 50 c-0.5 4 -4 7 -8 7 H45 c-4 0 -7.5 -3 -8 -7 L30 90 z"
              fill={PCT.terracotta} stroke={PCT.terracottaDeep} strokeWidth="1.5" />
            <path d="M26 88 h78" stroke={PCT.terracottaDeep} strokeWidth="2" strokeLinecap="round" />
            <path d="M65 88 c-4 -22 -16 -32 -28 -34" stroke={PCT.olive} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M65 88 c8 -28 22 -36 36 -32" stroke={PCT.olive} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M65 88 V64" stroke={PCT.olive} strokeWidth="2" strokeLinecap="round" />
            <circle cx="50" cy="115" r="9" fill={PCT.cream} stroke={PCT.terracottaDeep} strokeWidth="1.2" />
            <path d="M46 115 a4 4 0 0 1 8 0" fill="none" stroke={PCT.terracotta} strokeWidth="1" />
            <path d="M44 115 a6 6 0 0 1 12 0" fill="none" stroke={PCT.terracotta} strokeWidth="1" />
            <circle cx="50" cy="115" r="1" fill={PCT.terracotta} />
          </svg>
        </div>
      </div>
      <div className="mt-9 text-center">
        <div className="mb-3" style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
          color: PCT.terracotta,
        }}>· the trick ·</div>
        <h1 style={{
          margin: 0,
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 40, lineHeight: 1.05, fontWeight: 400, letterSpacing: '-0.025em',
          color: PCT.ink,
        }}>
          Tap a tag.<br />
          <span style={{ fontStyle: 'italic', color: PCT.terracottaDeep }}>Water a plant.</span>
        </h1>
        <p className="mx-auto mt-4.5" style={{
          maxWidth: 320,
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 15, lineHeight: 1.55, color: PCT.inkSoft,
        }}>
          Stick a tiny NFC sticker to each pot. Hold your phone to it
          when you water — the right plant gets logged automatically,
          no fumbling, no forgetting.
        </p>
      </div>
    </>
  )
}

function Step2({ region, onChange }: {
  region: typeof REGIONS[number]
  onChange: (r: typeof REGIONS[number]) => void
}) {
  return (
    <>
      <div className="mb-3" style={{
        fontFamily: 'ui-monospace, "SF Mono", monospace',
        fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
        color: PCT.terracotta,
      }}>· where in the world ·</div>
      <h1 style={{
        margin: 0,
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: 40, lineHeight: 1.05, fontWeight: 400, letterSpacing: '-0.025em',
        color: PCT.ink,
      }}>
        We tune the season<br />
        <span style={{ fontStyle: 'italic', color: PCT.terracottaDeep }}>to your hemisphere.</span>
      </h1>
      <p className="mx-auto mt-4.5 mb-7" style={{
        maxWidth: 320,
        fontFamily: 'Newsreader, Georgia, serif',
        fontSize: 15, lineHeight: 1.55, color: PCT.inkSoft,
      }}>
        Watering frequency dials back in winter and ramps up in summer.
        Pick your nearest city — you can change this any time in Settings.
      </p>

      <div className="flex flex-col gap-2 w-full" style={{ maxWidth: 320 }}>
        {REGIONS.map(r => {
          const active = r.label === region.label
          return (
            <button
              key={r.label}
              onClick={() => onChange(r)}
              className="flex items-center justify-between"
              style={{
                padding: '14px 18px',
                background: active ? PCT.cream : PCT.paper,
                border: `1px solid ${active ? PCT.terracotta : `${PCT.ink}14`}`,
                borderRadius: 16,
                boxShadow: active ? `0 0 0 4px ${PCT.terracottaSoft}66` : 'none',
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: 18, color: PCT.ink,
                fontStyle: active ? 'italic' : 'normal',
              }}
            >
              <span>{r.label}</span>
              <span style={{
                fontFamily: 'ui-monospace, "SF Mono", monospace',
                fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase',
                color: PCT.inkFaint,
              }}>{r.hemisphere}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}

function Step3() {
  return (
    <>
      <div className="relative" style={{ width: 200, height: 200 }}>
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 25%, ${PCT.terracottaSoft}, ${PCT.terracotta})`,
            boxShadow: `0 20px 40px rgba(165,78,38,0.25), inset 0 0 0 1px ${PCT.terracottaDeep}33`,
          }}
        >
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <path d="M60 80 c-6 -28 -22 -42 -38 -44 c0 18 14 42 38 44z" fill={PCT.cream} fillOpacity="0.8" />
            <path d="M60 80 c8 -34 28 -48 50 -44 c0 22 -18 46 -50 44z" fill={PCT.cream} />
            <path d="M60 80 V52" stroke={PCT.cream} strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div className="mt-9 text-center">
        <div className="mb-3" style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
          color: PCT.terracotta,
        }}>· let's begin ·</div>
        <h1 style={{
          margin: 0,
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 40, lineHeight: 1.05, fontWeight: 400, letterSpacing: '-0.025em',
          color: PCT.ink,
        }}>
          Let's meet<br />
          <span style={{ fontStyle: 'italic', color: PCT.terracottaDeep }}>your first plant.</span>
        </h1>
        <p className="mx-auto mt-4.5" style={{
          maxWidth: 320,
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 15, lineHeight: 1.55, color: PCT.inkSoft,
        }}>
          Search our library of six well-loved species, or add one of your own.
          We'll handle the watering rhythm from there.
        </p>
      </div>
    </>
  )
}

// ─── LaunchScreen (transient — for splash while data loads) ──────────────────
export function LaunchScreen() {
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{
        background: PCT.cream,
        backgroundImage: `
          radial-gradient(circle at 50% 30%, ${PCT.terracottaSoft}88, transparent 55%),
          radial-gradient(circle at 50% 90%, ${PCT.oliveSoft}55, transparent 55%)
        `,
        padding: '0 32px',
        gap: 24,
      }}
    >
      <AppIconMark size={140} />
      <div className="text-center mt-2">
        <Wordmark size={48} />
        <div className="mt-2" style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic', fontSize: 16, color: PCT.inkSoft,
          letterSpacing: 0.1,
        }}>
          a quiet little app for a thirsty little household
        </div>
      </div>
      <div className="absolute flex gap-1.5" style={{ bottom: 70 }}>
        {[0, 1, 2].map(i => (
          <span key={i} className="animate-launch-dot" style={{
            width: 5, height: 5, borderRadius: '50%',
            background: PCT.terracotta, opacity: 0.35,
            animationDelay: `${i * 0.18}s`,
          }} />
        ))}
      </div>
    </div>
  )
}
