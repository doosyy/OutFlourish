// Shared UI primitives — TopBar, AccordionRow, Tag, Pill, Toggle, FormField,
// GlassCircle, BottomSheet, CircleBtn, TerrazzoTexture.

import React, { useState } from 'react'
import { PCT } from '../tokens'
import { ChevronGlyph } from './Glyphs'

// ─── TopBar ──────────────────────────────────────────────────────────────────
interface TopBarProps {
  title?: string
  onBack?: () => void
  action?: React.ReactNode
  dark?: boolean
}

export function TopBar({ title, onBack, action, dark = false }: TopBarProps) {
  const c = dark ? PCT.cream : PCT.ink
  return (
    <div
      className="flex items-center gap-3 px-5.5 pb-2"
      style={{ paddingTop: 'max(56px, var(--sat))' }}
    >
      <button
        onClick={onBack}
        aria-label="Back"
        className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,251,243,0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: dark ? 'none' : `inset 0 0 0 1px ${PCT.ink}10`,
        }}
      >
        <ChevronGlyph color={c} size={18} />
      </button>
      <div
        className="flex-1 text-center"
        style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic',
          fontSize: 17,
          color: c,
        }}
      >
        {title}
      </div>
      <div className="w-9 h-9 flex items-center justify-center">{action}</div>
    </div>
  )
}

// ─── AccordionRow ────────────────────────────────────────────────────────────
interface AccordionRowProps {
  icon: React.ReactNode
  title: string
  body: string
  defaultOpen?: boolean
}

export function AccordionRow({ icon, title, body, defaultOpen = false }: AccordionRowProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderTop: `1px solid ${PCT.ink}18` }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3.5 w-full text-left bg-transparent"
        style={{ padding: '16px 4px' }}
      >
        <span
          style={{
            width: 22, height: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: PCT.terracotta,
          }}
        >
          {icon}
        </span>
        <span
          className="flex-1"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 22,
            color: PCT.ink,
            lineHeight: 1.0,
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic',
            fontSize: 14,
            color: PCT.inkFaint,
          }}
        >
          {open ? '— close' : 'read'}
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: '0 4px 18px 40px',
            fontFamily: 'Newsreader, Georgia, serif',
            fontSize: 15,
            lineHeight: 1.55,
            color: PCT.inkSoft,
          }}
        >
          {body}
        </div>
      )}
    </div>
  )
}

// ─── Tag (search result chip) ────────────────────────────────────────────────
interface TagProps { children: React.ReactNode; tone: string }
export function Tag({ children, tone }: TagProps) {
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 999,
        fontFamily: 'ui-monospace, "SF Mono", monospace',
        fontSize: 8.5,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: tone,
        background: `${tone}1c`,
        border: `1px solid ${tone}33`,
      }}
    >
      {children}
    </span>
  )
}

// ─── Pill (Settings control) ─────────────────────────────────────────────────
interface PillProps { children: React.ReactNode; subtle?: boolean }
export function Pill({ children, subtle = false }: PillProps) {
  return (
    <span
      style={{
        padding: '5px 12px',
        borderRadius: 999,
        background: subtle ? 'transparent' : PCT.cream,
        border: `1px solid ${PCT.ink}18`,
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontStyle: 'italic',
        fontSize: 13,
        color: subtle ? PCT.inkSoft : PCT.ink,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

// ─── Toggle ──────────────────────────────────────────────────────────────────
interface ToggleProps { on: boolean; onChange?: (next: boolean) => void; ariaLabel?: string }
export function Toggle({ on, onChange, ariaLabel }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={() => onChange?.(!on)}
      style={{
        width: 44, height: 26,
        borderRadius: 999,
        background: on ? PCT.olive : PCT.paperDeep,
        display: 'flex',
        alignItems: 'center',
        padding: 2,
        transition: 'background 0.2s',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 22, height: 22,
          borderRadius: '50%',
          background: PCT.cream,
          boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
          marginLeft: on ? 18 : 0,
          transition: 'margin-left 0.2s',
        }}
      />
    </button>
  )
}

// ─── CircleBtn (Home top-right action) ───────────────────────────────────────
interface CircleBtnProps {
  children: React.ReactNode
  filled?: boolean
  onClick?: () => void
  ariaLabel?: string
}
export function CircleBtn({ children, filled, onClick, ariaLabel }: CircleBtnProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: 38, height: 38,
        borderRadius: '50%',
        background: filled ? PCT.terracotta : 'rgba(255,255,255,0.6)',
        boxShadow: filled
          ? '0 4px 12px rgba(165,78,38,0.3)'
          : `inset 0 0 0 1px ${PCT.ink}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

// ─── GlassCircle (Plant Detail header) ───────────────────────────────────────
export function GlassCircle({ children, onClick, ariaLabel }: { children: React.ReactNode; onClick?: () => void; ariaLabel?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: 36, height: 36,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.18)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.28)',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

// ─── BottomSheet — modal shell with dim, drag handle, sheet-up animation ─────
interface BottomSheetProps {
  children: React.ReactNode
  onDismiss?: () => void
  /** if true, tapping the dim background calls onDismiss */
  dismissOnBackdrop?: boolean
}
export function BottomSheet({ children, onDismiss, dismissOnBackdrop = true }: BottomSheetProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ pointerEvents: 'auto' }}
    >
      {/* dim backdrop */}
      <div
        className="absolute inset-0 animate-toast-in"
        style={{ background: PCT.ink, opacity: 0.5 }}
        onClick={dismissOnBackdrop ? onDismiss : undefined}
      />
      {/* warm halo behind sheet */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 25%, ${PCT.terracotta}22, transparent 70%)`,
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />
      {/* sheet */}
      <div
        className="relative w-full max-w-lg animate-sheet-up bg-cream rounded-t-sheet shadow-sheet"
        style={{
          padding: `18px 26px max(36px, var(--sab))`,
          maxHeight: '88vh',
          overflowY: 'auto',
        }}
      >
        <div
          className="mx-auto mb-4.5 rounded-full"
          style={{ width: 48, height: 4, background: `${PCT.ink}33` }}
        />
        {children}
      </div>
    </div>
  )
}

// ─── FormField — labeled input with eyebrow kicker + suggestion pills ────────
interface FormFieldProps {
  label: string
  subhint?: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  focused?: boolean
  suggestions?: string[]
  type?: string
  inputRef?: React.RefObject<HTMLInputElement | null>
}

export function FormField({
  label, subhint, value, onChange, placeholder, focused, suggestions = [], type = 'text', inputRef,
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false)
  const active = focused ?? isFocused
  return (
    <div className="mb-4.5">
      <div className="flex items-baseline justify-between mb-1.5">
        <span style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase',
          color: PCT.terracotta,
        }}>{label}</span>
        {subhint && (
          <span style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic', fontSize: 12, color: PCT.inkFaint,
          }}>{subhint}</span>
        )}
      </div>
      <input
        ref={inputRef as React.Ref<HTMLInputElement>}
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="w-full"
        style={{
          padding: '14px 18px',
          background: active ? PCT.cream : PCT.paper,
          border: `1px solid ${active ? PCT.terracotta : `${PCT.ink}14`}`,
          borderRadius: 16,
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 22,
          color: PCT.ink,
          boxShadow: active ? `0 0 0 4px ${PCT.terracottaSoft}66` : 'none',
          outline: 'none',
          transition: 'box-shadow 0.2s, border-color 0.2s',
        }}
      />
      {suggestions.length > 0 && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => onChange?.(s)}
              style={{
                padding: '4px 10px', borderRadius: 999,
                background: s === value ? PCT.terracottaSoft : PCT.paper,
                color: s === value ? PCT.terracottaDeep : PCT.inkSoft,
                border: `1px solid ${PCT.ink}10`,
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontStyle: 'italic', fontSize: 13,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TerrazzoTexture — speckle overlay for the home summary widget ───────────
export function TerrazzoTexture() {
  const specks: Array<[number, number, number, string]> = [
    [12, 14, 6, '#fff5e7'], [78, 22, 4, '#f4a373'], [42, 68, 8, '#fff5e7'],
    [92, 70, 5, '#f4a373'], [22, 88, 4, '#fff5e7'], [60, 38, 3, '#5c2a14'],
    [85, 44, 6, '#5c2a14'], [10, 50, 3, '#5c2a14'], [33, 18, 5, '#f4a373'],
    [70, 90, 4, '#fff5e7'], [50, 8, 3, '#5c2a14'], [95, 12, 3, '#fff5e7'],
    [5, 30, 4, '#5c2a14'], [55, 56, 3, '#fff5e7'], [82, 85, 3, '#f4a373'],
  ]
  return (
    <svg
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.14,
        mixBlendMode: 'overlay',
      }}
    >
      {specks.map(([x, y, r, c], i) => (
        <circle key={i} cx={x} cy={y} r={r / 2} fill={c} />
      ))}
    </svg>
  )
}
