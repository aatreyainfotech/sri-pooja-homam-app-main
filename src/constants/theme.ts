export const theme = {
  colors: {
    primary: '#E67E22',
    primaryLight: '#F39C12',
    primaryDark: '#D35400',
    secondary: '#D4AF37',
    secondaryLight: '#F2D06B',
    secondaryDark: '#AA8721',
    accent: '#B22222',
    bg: '#FFF8E7',
    bgPaper: '#FDF5E6',
    bgDark: '#4A2C2A',
    overlay: 'rgba(74,44,42,0.65)',
    text: '#5A5A5A',
    textSecondary: '#4A2C2A',
    textMuted: '#8A7A6A',
    border: 'rgba(230,126,34,0.22)',
    borderFocus: '#E67E22',
    success: '#2E8B57',
    danger: '#B22222',
    white: '#FFFFFF',
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
