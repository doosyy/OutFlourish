// PCT — design tokens used inline (SVG fills, gradient strings, animation colours).
// Mirrors the OKLCH values in tailwind.config.js. When changing a colour,
// update both this file and tailwind.config.js so utility classes match.

export const PCT = {
  cream:           'oklch(0.965 0.012 80)',
  paper:           'oklch(0.93 0.018 75)',
  paperDeep:       'oklch(0.88 0.022 70)',

  terracotta:      'oklch(0.62 0.115 42)',
  terracottaDeep:  'oklch(0.46 0.105 38)',
  terracottaSoft:  'oklch(0.86 0.045 50)',

  olive:           'oklch(0.52 0.058 115)',
  oliveDeep:       'oklch(0.34 0.045 118)',
  oliveSoft:       'oklch(0.88 0.030 110)',

  ink:             'oklch(0.215 0.018 60)',
  inkSoft:         'oklch(0.42 0.018 60)',
  inkFaint:        'oklch(0.58 0.014 70)',

  thirsty:         'oklch(0.55 0.16 32)',
  soon:            'oklch(0.70 0.135 70)',
  happy:           'oklch(0.55 0.075 145)',
} as const

export type LightTagInfo = { label: string; color: string; bg: string }
export const PCLightTag: Record<'low' | 'medium' | 'bright', LightTagInfo> = {
  low:    { label: 'Low light',    color: 'oklch(0.55 0.018 60)',  bg: 'oklch(0.91 0.012 60)' },
  medium: { label: 'Medium light', color: 'oklch(0.52 0.058 115)', bg: 'oklch(0.92 0.025 110)' },
  bright: { label: 'Bright light', color: 'oklch(0.58 0.115 65)',  bg: 'oklch(0.94 0.030 70)' },
}

// Accent for a given hydration level: thirsty < 0.25, soon < 0.5, olive otherwise.
export function accentFor(hydration: number): string {
  if (hydration < 0.25) return PCT.thirsty
  if (hydration < 0.50) return PCT.soon
  return PCT.olive
}
