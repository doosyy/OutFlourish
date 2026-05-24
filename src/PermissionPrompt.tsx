// PermissionPrompt — pre-prompt shown BEFORE iOS's native dialog so users
// understand the why. One shell + 4 PERM_CONFIG entries: NFC / Notifications /
// Camera / Photos.

import React from 'react'
import { PCT } from './tokens'
import { ChevronGlyph, NFCGlyph, BellGlyph, CameraGlyph, PhotosGlyph } from './components/Glyphs'

export type PermissionKind = 'nfc' | 'notifications' | 'camera' | 'photos'

interface Props {
  kind: PermissionKind
  onEnable: () => void | Promise<void>
  onDecline?: () => void
  onBack?: () => void
}

interface Config {
  kicker: string
  title: React.ReactNode
  body: string
  bullets: string[]
  cta: string
  decline: string
  icon: (color: string) => React.ReactNode
  withPulse?: boolean
}

const CONFIG: Record<PermissionKind, Config> = {
  nfc: {
    kicker: 'NFC',
    title: <>Tap a tag.<br /><span style={{ fontStyle: 'italic', color: PCT.terracottaDeep }}>Water a plant.</span></>,
    body: 'OutFlourish reads small NFC stickers stuck to your pots, so the right plant gets logged the moment you tend it.',
    bullets: [
      'No fumbling for the right plant in your list.',
      'Works even when the app is closed.',
      'Tags are inert — no power, no data leaves your phone.',
    ],
    cta: 'Enable NFC',
    decline: 'Maybe later',
    icon: c => <NFCGlyph color={c} size={56} />,
    withPulse: true,
  },
  notifications: {
    kicker: 'Notifications',
    title: <>A gentle nudge<br /><span style={{ fontStyle: 'italic', color: PCT.terracottaDeep }}>when something's thirsty.</span></>,
    body: 'One quiet badge in the morning. No marketing, no nags, no streaks to break.',
    bullets: [
      'Only fires when a plant is actually due.',
      'Quiet hours respected (9pm–7am by default).',
      'Tap to open straight to the thirsty plant.',
    ],
    cta: 'Allow notifications',
    decline: 'Not now',
    icon: c => <BellGlyph color={c} size={54} />,
  },
  camera: {
    kicker: 'Camera',
    title: <>A proper portrait<br /><span style={{ fontStyle: 'italic', color: PCT.terracottaDeep }}>of your plant.</span></>,
    body: 'Snap a real photo when you add a plant. We use it as the hero image and the moisture meter.',
    bullets: [
      'Photos stay on your device.',
      'A soft outline helps you frame it.',
      'Skip it and we use a stock photo instead.',
    ],
    cta: 'Open camera',
    decline: 'Use a stock photo',
    icon: c => <CameraGlyph color={c} size={48} />,
  },
  photos: {
    kicker: 'Photos',
    title: <>Or pick one<br /><span style={{ fontStyle: 'italic', color: PCT.terracottaDeep }}>from your library.</span></>,
    body: 'We only see the photos you pick, never your whole library. Apple makes sure of that.',
    bullets: [
      'Limited access only — pick what you share.',
      'No analytics, no uploads to any server.',
      'Change your mind any time in Settings.',
    ],
    cta: 'Choose a photo',
    decline: 'Skip',
    icon: c => <PhotosGlyph color={c} size={50} />,
  },
}

export default function PermissionPrompt({ kind, onEnable, onDecline, onBack }: Props) {
  const conf = CONFIG[kind]

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col"
      style={{
        background: PCT.cream,
        backgroundImage: `
          radial-gradient(circle at 50% 22%, ${PCT.terracottaSoft}aa, transparent 50%),
          radial-gradient(circle at 50% 90%, ${PCT.oliveSoft}55, transparent 55%)
        `,
        paddingTop: 'max(56px, var(--sat))',
        paddingBottom: 'max(56px, var(--sab))',
        fontFamily: 'Newsreader, Georgia, serif',
        color: PCT.ink,
      }}
    >
      {/* Tiny top — back chevron */}
      <div className="px-5.5 py-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,251,243,0.7)',
            boxShadow: `inset 0 0 0 1px ${PCT.ink}10`,
          }}
          aria-label="Back"
        >
          <ChevronGlyph color={PCT.ink} size={16} />
        </button>
      </div>

      {/* Illustration */}
      <div className="flex justify-center items-center px-7" style={{ padding: '36px 32px 24px' }}>
        <div
          className="relative flex items-center justify-center"
          style={{
            width: 180, height: 180,
            borderRadius: '50%',
            background: PCT.terracottaSoft,
            boxShadow: `inset 0 0 0 1px ${PCT.terracottaDeep}33`,
          }}
        >
          {conf.icon(PCT.terracottaDeep)}
          {conf.withPulse && (
            <>
              <span className="absolute inset-0 animate-perm-ring" style={{
                border: `1.5px solid ${PCT.terracotta}`,
                borderRadius: '50%',
              }} />
              <span className="absolute inset-0 animate-perm-ring" style={{
                border: `1.5px solid ${PCT.terracotta}`,
                borderRadius: '50%',
                animationDelay: '0.5s',
              }} />
            </>
          )}
        </div>
      </div>

      {/* Copy block */}
      <div className="px-7 text-center flex-1">
        <div className="mb-3.5" style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
          color: PCT.terracotta,
        }}>· {conf.kicker} ·</div>
        <h1 style={{
          margin: 0,
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 36, lineHeight: 1.08, fontWeight: 400,
          letterSpacing: '-0.025em', color: PCT.ink,
        }}>{conf.title}</h1>
        <p className="mx-auto" style={{
          marginTop: 18, marginBottom: 26,
          maxWidth: 320,
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 15, lineHeight: 1.55, color: PCT.inkSoft,
        }}>{conf.body}</p>

        <div
          className="text-left flex flex-col gap-2"
          style={{
            margin: '0 8px',
            padding: '14px 16px',
            background: PCT.paper,
            border: `1px solid ${PCT.ink}10`,
            borderRadius: 18,
          }}
        >
          {conf.bullets.map((b, i) => (
            <div key={i} className="flex gap-2.5">
              <span
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: PCT.oliveSoft,
                  color: PCT.oliveDeep,
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontStyle: 'italic', fontSize: 11,
                  marginTop: 2,
                }}
              >
                {i + 1}
              </span>
              <span style={{
                fontFamily: 'Newsreader, Georgia, serif',
                fontSize: 13.5, lineHeight: 1.4, color: PCT.ink,
              }}>{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-2.5 items-center px-5.5" style={{ marginTop: 'auto' }}>
        <button
          onClick={onEnable}
          className="w-full text-center"
          style={{
            padding: 15,
            background: PCT.terracotta, color: PCT.cream,
            borderRadius: 18,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 18,
            boxShadow: '0 12px 28px rgba(165,78,38,0.32)',
          }}
        >
          {conf.cta}
        </button>
        {onDecline && (
          <button
            onClick={onDecline}
            style={{
              padding: 10,
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 14, color: PCT.inkFaint,
            }}
          >
            {conf.decline}
          </button>
        )}
      </div>
    </div>
  )
}
