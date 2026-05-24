// WateringLoggedToast — slides up at bottom, auto-dismisses after 5s with
// an animated progress bar, includes an "Undo" button.
//
// Also a generic Toast for arbitrary messages.

import { useEffect } from 'react'
import { PCT } from '../tokens'
import { CheckGlyph } from '../components/Glyphs'

interface Props {
  /** Eyebrow line (e.g. "Logged · 8:14am") */
  kicker?: string
  /** Body text (e.g. "Margot got 250 ml.") */
  message: string
  /** seconds visible — default 5 */
  duration?: number
  /** show undo button */
  onUndo?: () => void
  onDismiss?: () => void
  tone?: 'success' | 'error' | 'neutral'
}

export default function Toast({
  kicker, message, duration = 5, onUndo, onDismiss, tone = 'success',
}: Props) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss?.(), duration * 1000)
    return () => clearTimeout(t)
  }, [duration, onDismiss])

  const accentBg = tone === 'success' ? PCT.olive
    : tone === 'error' ? PCT.thirsty
    : PCT.terracotta
  const accentSoft = tone === 'success' ? PCT.oliveSoft
    : tone === 'error' ? `${PCT.thirsty}55`
    : PCT.terracottaSoft

  return (
    <div
      className="fixed left-5.5 right-5.5 z-40 animate-toast-in"
      style={{ bottom: 'max(36px, var(--sab))', maxWidth: 480, margin: '0 auto' }}
    >
      <div
        className="flex items-center gap-3.5 relative overflow-hidden"
        style={{
          background: PCT.ink, color: PCT.cream,
          padding: '14px 16px',
          borderRadius: 22,
          boxShadow: '0 18px 36px rgba(58,30,18,0.4)',
        }}
      >
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 38, height: 38,
            borderRadius: '50%',
            background: accentBg,
          }}
        >
          <CheckGlyph color={PCT.cream} size={18} />
        </div>

        <div className="flex-1 min-w-0">
          {kicker && (
            <div style={{
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
              color: accentSoft, marginBottom: 2,
            }}>{kicker}</div>
          )}
          <div style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 16, color: PCT.cream,
          }}>{message}</div>
        </div>

        {onUndo && (
          <button
            onClick={onUndo}
            className="flex-shrink-0"
            style={{
              padding: '8px 14px',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 999,
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic', fontSize: 13,
              color: PCT.cream,
            }}
          >
            Undo
          </button>
        )}

        {/* Auto-dismiss progress bar */}
        <div
          className="absolute left-0 right-0 bottom-0 animate-toast-progress origin-left"
          style={{
            height: 2,
            background: PCT.terracottaSoft,
            animationDuration: `${duration}s`,
          }}
        />
      </div>
    </div>
  )
}
