/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './design-snippets/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FBF9F6',
          100: '#F4F0E8',
          200: '#E8E0D0',
        },
        ink: {
          950: '#1A1817',
          900: '#2C2A29',
          700: '#4A4644',
          500: '#79716C',
          300: '#A8A29C',
        },
        sage: {
          50: '#EEF2EE',
          200: '#C7D4C9',
          400: '#92AC97',
          500: '#5F7D6B',
          600: '#4A6555',
          700: '#384E41',
        },
        forest: {
          900: '#0B0F0D',
          800: '#121614',
          700: '#1E2320',
          600: '#2A312C',
          500: '#3A413C',
        },
        emerald: {
          glow: '#7FD89F',
        },
        sand: {
          400: '#D4A574',
          500: '#B88A56',
        },
        clay: {
          400: '#C25A4A',
          500: '#A8453A',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'system-ui',
          'sans-serif',
        ],
        rounded: [
          'SF Pro Rounded',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
      letterSpacing: {
        'tightest': '-0.04em',
        'tighter': '-0.025em',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'glass-light': '0 8px 32px -8px rgba(60, 50, 40, 0.12), 0 2px 8px -4px rgba(60, 50, 40, 0.08)',
        'glass-dark': '0 8px 32px -8px rgba(0, 0, 0, 0.5), 0 2px 8px -4px rgba(0, 0, 0, 0.3)',
        'glow-sage': '0 0 40px -8px rgba(95, 125, 107, 0.4)',
        'glow-emerald': '0 0 32px -4px rgba(127, 216, 159, 0.5)',
      },
      keyframes: {
        'breathe': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.88', transform: 'scale(0.985)' },
        },
        'scale-burst': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)' },
        },
        'ring-fill': {
          from: { strokeDashoffset: 'var(--ring-circ)' },
          to: { strokeDashoffset: 'var(--ring-target)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'water-drop': {
          '0%': { opacity: '0', transform: 'translateY(-12px) scale(0.6)' },
          '50%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(8px) scale(0.8)' },
        },
      },
      animation: {
        'breathe': 'breathe 4.5s ease-in-out infinite',
        'scale-burst': 'scale-burst 0.7s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'sheet-up': 'sheet-up 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        'water-drop': 'water-drop 1.2s ease-out',
      },
      backdropBlur: {
        'glass': '14px',
      },
    },
  },
  plugins: [],
}
