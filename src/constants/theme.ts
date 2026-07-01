// ── Canonical premium palette ──────────────────────────────────────────────
// Rich deep-maroon + antique-gold theme shared across every page.
// Import these named tokens instead of hard-coding hex values so the whole
// app stays visually consistent.
export const palette = {
  gold: '#C9922A',        // antique gold (primary accent)
  goldLight: '#E3B85C',
  goldDark: '#A67A1E',
  goldSoft: '#F2D06B',
  maroon: '#7A3020',      // deep maroon (primary brand)
  maroonLight: '#9A4130',
  maroonDeep: '#3D1408',  // rich shadow maroon for gradients
  dark: '#1A0C07',        // near-black warm base
  cream: '#FFF8EF',       // warm ivory background
  creamPaper: '#FDF6EA',
  creamDeep: '#F7E9CF',
  text: '#3A2A22',        // warm dark body text
  textSecondary: '#4A2C2A',
  textMuted: '#8A7A6A',
  success: '#2E7D5B',
  danger: '#B22222',
  white: '#FFFFFF',
};

export const theme = {
  colors: {
    primary: palette.maroon,
    primaryLight: palette.maroonLight,
    primaryDark: palette.maroonDeep,
    secondary: palette.gold,
    secondaryLight: palette.goldLight,
    secondaryDark: palette.goldDark,
    accent: palette.maroon,
    bg: palette.cream,
    bgPaper: palette.creamPaper,
    bgDark: palette.dark,
    overlay: 'rgba(26,12,7,0.65)',
    text: palette.text,
    textSecondary: palette.textSecondary,
    textMuted: palette.textMuted,
    border: 'rgba(122,48,32,0.18)',
    borderFocus: palette.maroon,
    success: palette.success,
    danger: palette.danger,
    white: palette.white,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 20,
    xl: 28,
    full: 999,
  },
  font: {
    heading: 'Cinzel-Bold',
    body: 'DMSans-Regular',
  },
};

export type Theme = typeof theme;
