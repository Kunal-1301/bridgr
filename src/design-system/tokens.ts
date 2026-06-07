export const bridgrTokens = {
  color: {
    primary: {
      800: '#1A3A5C',
      600: '#1A5FA8',
      400: '#4A90D9',
      50: '#EAF1FA',
    },
    accent: {
      500: '#F0A500',
      50: '#FCF3DC',
    },
    neutral: {
      900: '#1E293B',
      600: '#475569',
      200: '#D1D9E6',
      50: '#F3F6FA',
    },
    semantic: {
      success: '#16A34A',
      warning: '#D97706',
      error: '#DC2626',
      info: '#0284C7',
    },
  },
  radius: {
    control: '6px',
    card: '14px',
    panel: '20px',
    mobileShell: '30px',
  },
  shadow: {
    sm: '0 1px 2px rgba(26,58,92,.06), 0 1px 3px rgba(26,58,92,.08)',
    md: '0 4px 16px rgba(26,58,92,.08), 0 1px 3px rgba(26,58,92,.06)',
    lg: '0 12px 32px rgba(26,58,92,.12)',
  },
  typography: {
    display: { fontSize: '36px', lineHeight: '44px', fontWeight: 700 },
    pageTitle: { fontSize: '28px', lineHeight: '36px', fontWeight: 700 },
    section: { fontSize: '22px', lineHeight: '30px', fontWeight: 600 },
    subhead: { fontSize: '18px', lineHeight: '26px', fontWeight: 600 },
    bodyLarge: { fontSize: '16px', lineHeight: '26px', fontWeight: 400 },
    body: { fontSize: '14px', lineHeight: '22px', fontWeight: 400 },
    caption: { fontSize: '12px', lineHeight: '18px', fontWeight: 400 },
  },
} as const

export type BridgrTokens = typeof bridgrTokens
