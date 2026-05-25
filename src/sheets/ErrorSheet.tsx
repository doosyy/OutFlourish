// ErrorSheet. Four variants for NFC + upload failures.
// One shell, content selected via `kind`.

import React from 'react'
import { PCT } from '../tokens'
import { BottomSheet } from '../components/UI'
import { NFCGlyph, CameraGlyph } from '../components/Glyphs'

export type ErrorKind = 'tag-unknown' | 'tag-write-failed' | 'nfc-unavailable' | 'upload-failed'

interface Props {
  kind: ErrorKind
  onPrimary?: () => void
  onSecondary?: () => void
  onDismiss?: () => void
}

interface Config {
  severity: 'warn' | 'danger'
  kicker: string
  title: string
  body: string
  primary: string
  secondary: string | null
  icon: (color: string) => React.ReactNode
}

const CONFIG: Record<ErrorKind, Config> = {
  'tag-unknown': {
    severity: 'warn',
    kicker: 'Unknown tag',
    title: "A tag we don't recognise.",
    body: "This NFC sticker isn't paired with any plant in your garden. You can pair it now with an existing plant or add a new one.",
    primary: 'Add new plant',
    secondary: 'Pair existing',
    icon: c => <NFCGlyph color={c} size={32} />,
  },
  'tag-write-failed': {
    severity: 'danger',
    kicker: 'Write failed',
    title: "The tag didn't take.",
    body: 'Hold the phone steady against the tag and try again. The sticker may be too far, damaged, or write-protected.',
    primary: 'Try again',
    secondary: 'Skip pairing',
    icon: c => <NFCGlyph color={c} size={32} />,
  },
  'nfc-unavailable': {
    severity: 'warn',
    kicker: 'NFC not available',
    title: "This phone can't read tags.",
    body: 'OutFlourish still works without NFC. You can log waterings by tapping the button on each plant. NFC requires iPhone 7 or newer with iOS 14+.',
    primary: 'Continue without NFC',
    secondary: null,
    icon: c => <NFCGlyph color={c} size={32} />,
  },
  'upload-failed': {
    severity: 'danger',
    kicker: 'Upload failed',
    title: "That photo wouldn't save.",
    body: 'The image might be too large or in an unsupported format. Try a different photo, or skip this and use a stock one for now.',
    primary: 'Pick another',
    secondary: 'Use stock',
    icon: c => <CameraGlyph color={c} size={32} />,
  },
}

export default function ErrorSheet({ kind, onPrimary, onSecondary, onDismiss }: Props) {
  const conf = CONFIG[kind]
  const iconColor = conf.severity === 'danger' ? PCT.thirsty : PCT.terracottaDeep
  const kickerColor = conf.severity === 'danger' ? PCT.thirsty : PCT.terracotta

  return (
    <BottomSheet onDismiss={onDismiss}>
      <div className="flex justify-center mb-4.5">
        <div
          className="flex items-center justify-center"
          style={{
            width: 76, height: 76, borderRadius: '50%',
            background: conf.severity === 'danger' ? `${PCT.thirsty}1c` : PCT.terracottaSoft,
            boxShadow: `inset 0 0 0 1px ${iconColor}33`,
          }}
        >
          {conf.icon(iconColor)}
        </div>
      </div>

      <div className="text-center mb-2" style={{
        fontFamily: 'ui-monospace, "SF Mono", monospace',
        fontSize: 10, letterSpacing: '0.30em', textTransform: 'uppercase',
        color: kickerColor,
      }}>· {conf.kicker} ·</div>

      <h2 className="text-center" style={{
        margin: 0,
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: 30, lineHeight: 1.05, fontWeight: 400, letterSpacing: '-0.025em',
        color: PCT.ink,
      }}>{conf.title}</h2>

      <p className="text-center mx-auto" style={{
        marginTop: 14, marginBottom: 24,
        maxWidth: 320,
        fontFamily: 'Newsreader, Georgia, serif',
        fontSize: 14.5, lineHeight: 1.5, color: PCT.inkSoft,
      }}>{conf.body}</p>

      <div className="flex gap-2.5">
        {conf.secondary && (
          <button
            onClick={onSecondary}
            className="flex-1 text-center"
            style={{
              padding: 15,
              background: PCT.paper,
              border: `1px solid ${PCT.ink}14`,
              borderRadius: 18,
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 17, color: PCT.inkSoft,
            }}
          >
            {conf.secondary}
          </button>
        )}
        <button
          onClick={onPrimary}
          className="text-center"
          style={{
            flex: conf.secondary ? 1.4 : 1,
            padding: 15,
            background: PCT.terracotta, color: PCT.cream,
            borderRadius: 18,
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 17,
            boxShadow: '0 8px 18px rgba(165,78,38,0.3)',
          }}
        >
          {conf.primary}
        </button>
      </div>
    </BottomSheet>
  )
}
