import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [],
  theme: {
    extend: {
      colors: {
        primary: {
          800: '#1A3A5C',
          600: '#1A5FA8',
          400: '#4A90D9',
          50: '#EAF1FA',
          DEFAULT: '#1A5FA8',
        },
        neutral: {
          950: '#0F172A',
          900: '#1E293B',
          700: '#334155',
          600: '#475569',
          300: '#B8C3D4',
          200: '#D1D9E6',
          100: '#E6EBF2',
          50: '#F3F6FA',
          DEFAULT: '#475569',
        },
        accent: {
          500: '#F0A500',
          50: '#FCF3DC',
          DEFAULT: '#F0A500',
        },
        navy: { 800: '#1A3A5C', DEFAULT: '#1A3A5C' },
        blue: { 600: '#1A5FA8', 400: '#4A90D9', tint: '#EAF1FA', DEFAULT: '#1A5FA8' },
        amber: { 500: '#F0A500', tint: '#FCF3DC', DEFAULT: '#F0A500' },
        ink: '#1E293B',
        muted: '#475569',
        border: '#D1D9E6',
        surface: '#F3F6FA',
        success: { DEFAULT: '#16A34A', tint: '#E4F4EA' },
        warning: { DEFAULT: '#D97706', tint: '#FBEEDD' },
        error: { DEFAULT: '#DC2626', tint: '#FBE9E9' },
        info: { DEFAULT: '#0284C7', tint: '#E2F1FA' },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        display: ['36px', { lineHeight: '44px', fontWeight: '700' }],
        'page-title': ['28px', { lineHeight: '36px', fontWeight: '700' }],
        section: ['22px', { lineHeight: '30px', fontWeight: '600' }],
        subhead: ['18px', { lineHeight: '26px', fontWeight: '600' }],
        body: ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'body-lg': ['16px', { lineHeight: '26px', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '18px', fontWeight: '400' }],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '30px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(26,58,92,.06), 0 1px 3px rgba(26,58,92,.08)',
        md: '0 4px 16px rgba(26,58,92,.08), 0 1px 3px rgba(26,58,92,.06)',
        lg: '0 12px 32px rgba(26,58,92,.12)',
        panel: '0 18px 48px rgba(26,58,92,.12)',
        phone: '0 24px 70px rgba(26,58,92,.18)',
      }
    },
  },
  plugins: [],
} satisfies Config
