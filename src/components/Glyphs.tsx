// Line-drawn icon set — serif-spirited, used across the app.
// All take `{ color, size }`; default color = currentColor so they inherit
// from the surrounding Tailwind text class.

interface IconProps { color?: string; size?: number; className?: string }

export function ChevronGlyph({ color = 'currentColor', size = 18, className, direction = 'left' }: IconProps & { direction?: 'left' | 'right' | 'up' | 'down' }) {
  const rotation = direction === 'right' ? 180 : direction === 'up' ? 90 : direction === 'down' ? -90 : 0
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}
      style={{ transform: rotation ? `rotate(${rotation}deg)` : undefined }}>
      <path d="M11 4L6 9l5 5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function HomeGlyph({ color = 'currentColor', size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-7h-6v7H5a1 1 0 01-1-1v-9z"
        stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export function GearGlyph({ color = 'currentColor', size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PlusGlyph({ color = 'currentColor', size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className}>
      <path d="M8 2v12M2 8h12" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function DotsGlyph({ color = 'currentColor', size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill={color} className={className}>
      <circle cx="4" cy="9" r="1.4" />
      <circle cx="9" cy="9" r="1.4" />
      <circle cx="14" cy="9" r="1.4" />
    </svg>
  )
}

export function DropGlyph({ color = 'currentColor', size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3c-2 4-6 8-6 12a6 6 0 0012 0c0-4-4-8-6-12z"
        stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={color} fillOpacity="0.15" />
    </svg>
  )
}

export function SunGlyph({ color = 'currentColor', size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.5" />
      <path d="M12 2v2M12 20v2M22 12h-2M4 12H2M19 5l-1.4 1.4M6.4 17.6L5 19M19 19l-1.4-1.4M6.4 6.4L5 5"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function FoodGlyph({ color = 'currentColor', size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 3h6v3a3 3 0 01-1 2.2v10.8a3 3 0 11-6 0V8.2A3 3 0 017 6V3h2z"
        stroke={color} strokeWidth="1.4" />
      <path d="M9 13h6" stroke={color} strokeWidth="1.4" />
    </svg>
  )
}

export function SeasonGlyph({ color = 'currentColor', size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 18C5 11 10 5 19 5c0 9-6 14-13 14-1.5 0-1.5-1-1-1z"
        stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6 18C10 14 14 10 18 7" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function TroubleGlyph({ color = 'currentColor', size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.4" />
      <path d="M12 7v6M12 16v0.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function NFCGlyph({ color = 'currentColor', size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 12c0-3.5 2-6 4-7" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 12c0-2 1.2-3.6 2-4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13 12c0-0.8 0.5-1.5 1-2" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16.5" cy="12" r="1.2" fill={color} />
      <path d="M5 12c0 3.5 2 6 4 7" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 12c0 2 1.2 3.6 2 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13 12c0 0.8 0.5 1.5 1 2" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function SearchGlyph({ color = 'currentColor', size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <circle cx="8" cy="8" r="5" stroke={color} strokeWidth="1.5" />
      <path d="M12 12l4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function EditGlyph({ color = 'currentColor', size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 20l4-1L20 7l-3-3L5 16l-1 4z"
        stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 6l3 3" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

export function RepotGlyph({ color = 'currentColor', size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 13h12l-1.5 7h-9L6 13z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M4 11h16M12 11c0-3 2-6 5-6M12 11c0-2-1-4-3-4"
        stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function LeafGlyph({ color = 'currentColor', size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 18C5 11 10 5 19 5c0 9-6 14-13 14-1.5 0-1.5-1-1-1z" fill={color} />
    </svg>
  )
}

export function BellGlyph({ color = 'currentColor', size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 17h14l-2-3v-4a5 5 0 00-10 0v4l-2 3z"
        stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 004 0" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function CameraGlyph({ color = 'currentColor', size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2.5" stroke={color} strokeWidth="1.6" />
      <path d="M8 7l1.5-2.5h5L16 7" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="13.5" r="3.5" stroke={color} strokeWidth="1.6" />
    </svg>
  )
}

export function PhotosGlyph({ color = 'currentColor', size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="5" width="14" height="14" rx="2.5" stroke={color} strokeWidth="1.6" />
      <path d="M5 16l5-4 3 3 2-2 4 4" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="9.5" cy="9" r="1.4" fill={color} />
    </svg>
  )
}

export function CheckGlyph({ color = 'currentColor', size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className}>
      <path d="M4 11l5 5 9-11" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CloseGlyph({ color = 'currentColor', size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3 3l10 10M13 3L3 13" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
