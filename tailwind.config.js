/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './design-snippets/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // PCT — OKLCH design tokens
        cream:           'oklch(0.965 0.012 80)',
        paper:           'oklch(0.93 0.018 75)',
        paperDeep:       'oklch(0.88 0.022 70)',
        terracotta: {
          DEFAULT:       'oklch(0.62 0.115 42)',
          deep:          'oklch(0.46 0.105 38)',
          soft:          'oklch(0.86 0.045 50)',
        },
        olive: {
          DEFAULT:       'oklch(0.52 0.058 115)',
          deep:          'oklch(0.34 0.045 118)',
          soft:          'oklch(0.88 0.030 110)',
        },
        ink: {
          DEFAULT:       'oklch(0.215 0.018 60)',
          soft:          'oklch(0.42 0.018 60)',
          faint:         'oklch(0.58 0.014 70)',
        },
        thirsty:         'oklch(0.55 0.16 32)',
        soon:            'oklch(0.70 0.135 70)',
        happy:           'oklch(0.55 0.075 145)',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body:    ['Newsreader', 'Georgia', 'serif'],
        mono:    ['ui-monospace', '"SF Mono"', 'monospace'],
      },
      spacing: {
        '4.5': '18px',
        '5.5': '22px',
        '7':   '28px',
        '9':   '36px',
        '12':  '48px',
      },
      borderRadius: {
        'pill':   '12px',
        'card-s': '16px',
        'btn':    '18px',
        'card':   '22px',
        'card-l': '28px',
        'sheet':  '36px',
      },
      letterSpacing: {
        eyebrow:    '0.16em',
        eyebrowLg:  '0.22em',
        eyebrowXl:  '0.30em',
        tighter:    '-0.025em',
        tightest:   '-0.04em',
      },
      boxShadow: {
        'subtle':       '0 1px 3px rgba(58,30,18,0.06), 0 8px 24px rgba(58,30,18,0.06)',
        'cta':          '0 12px 28px rgba(165,78,38,0.32)',
        'cta-sm':       '0 8px 18px rgba(165,78,38,0.30)',
        'sheet':        '0 -20px 60px rgba(0,0,0,0.32)',
        'photo':        '0 12px 28px rgba(58,30,18,0.18)',
        'pill-ink':     '0 12px 32px rgba(58,30,18,0.32)',
        'terra-card':   '0 18px 40px rgba(165,78,38,0.32), inset 0 0 0 1px rgba(255,255,255,0.12)',
        'inset-ink':    'inset 0 0 0 1px rgba(0,0,0,0.06)',
      },
      keyframes: {
        // PlantPhotoMeter / MoistureMeter wave flow
        'wave-front': {
          from: { transform: 'translate3d(0, 0, 0)' },
          to:   { transform: 'translate3d(-100%, 0, 0)' },
        },
        'wave-back': {
          from: { transform: 'translate3d(-100%, 0, 0)' },
          to:   { transform: 'translate3d(0, 0, 0)' },
        },
        'meter-rise': {
          from: { transform: 'translateY(40%)', opacity: '0.6' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },

        // Overdue plant detail badge + halo
        'overdue-badge-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.06)' },
        },

        // Sparkline today-dot pulse
        'today-dot-pulse-r': {
          '0%, 100%': { r: '4' },
          '50%':      { r: '10' },
        },
        'today-dot-pulse-o': {
          '0%, 100%': { opacity: '0.5' },
          '50%':      { opacity: '0' },
        },

        // Toast slide-up + progress bar
        'toast-in': {
          from: { transform: 'translateY(40px)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
        'toast-progress': {
          from: { transform: 'scaleX(1)' },
          to:   { transform: 'scaleX(0)' },
        },

        // Bottom sheet rise
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },

        // Onboarding NFC pulse
        'nfc-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.3' },
          '50%':      { transform: 'scale(1.4)', opacity: '1' },
        },

        // Permission ring pulse (NFC pre-prompt)
        'perm-ring': {
          '0%':   { transform: 'scale(0.92)', opacity: '0.6' },
          '100%': { transform: 'scale(1.35)', opacity: '0' },
        },

        // Launch dot bounce
        'launch-dot': {
          '0%, 80%, 100%': { opacity: '0.25', transform: 'translateY(0)' },
          '40%':           { opacity: '1',    transform: 'translateY(-3px)' },
        },

        // Caret blink
        'caret': {
          '50%': { opacity: '0' },
        },

        // Subtle breathing for overdue states
        'breathe': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.88', transform: 'scale(0.985)' },
        },
      },
      animation: {
        'wave-front':          'wave-front 5s linear infinite',
        'wave-back':           'wave-back 7.5s linear infinite',
        'meter-rise':          'meter-rise 1.1s cubic-bezier(.22,.7,.18,1) both',
        'overdue-badge':       'overdue-badge-pulse 2.2s ease-in-out infinite',
        'today-dot-r':         'today-dot-pulse-r 1.8s linear infinite',
        'today-dot-o':         'today-dot-pulse-o 1.8s linear infinite',
        'toast-in':            'toast-in 0.35s cubic-bezier(.2,.7,.2,1) both',
        'toast-progress':      'toast-progress 5s linear forwards',
        'sheet-up':            'sheet-up 0.35s cubic-bezier(0.32,0.72,0,1) both',
        'nfc-pulse':           'nfc-pulse 1.6s ease-in-out infinite',
        'perm-ring':           'perm-ring 2s ease-out infinite',
        'launch-dot':          'launch-dot 1.4s ease-in-out infinite',
        'caret':               'caret 1s steps(2) infinite',
        'breathe':             'breathe 4.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
