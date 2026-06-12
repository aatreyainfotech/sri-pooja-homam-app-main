export const theme = {
  colors: {
    primary: '#8B1515',
    primaryLight: '#A32A2A',
    primaryDark: '#630B0B',
    secondary: '#D4AF37',
    secondaryLight: '#F2D06B',
    secondaryDark: '#AA8721',
    accent: '#FF9933',
    bg: '#FDFBF7',
    bgPaper: '#FFFFFF',
    bgDark: '#2D1B19',
    overlay: 'rgba(45, 27, 25, 0.6)',
    text: '#2D1B19',
    textSecondary: '#5C4033',
    textMuted: '#8A736C',
    border: '#E8D8D0',
    borderFocus: '#D4AF37',
    success: '#2E7D32',
    danger: '#C62828',
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
