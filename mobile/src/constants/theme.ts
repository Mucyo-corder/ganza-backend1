export const COLORS = {
  primary: '#5D4037',
  primaryLight: '#8D6E63',
  primaryDark: '#3E2723',
  secondary: '#D4A017',
  secondaryLight: '#F5D76E',
  accent: '#C17A14',
  background: '#1A1A1A',
  surface: '#2D2A26',
  surfaceLight: '#3D3935',
  card: '#2A2724',
  text: '#F5F0EB',
  textSecondary: '#A09890',
  textMuted: '#6B6360',
  cream: '#FFF8E7',
  creamLight: '#FFFDE7',
  border: '#4A4540',
  success: '#4CAF50',
  error: '#E53935',
  warning: '#FF9800',
  info: '#2196F3',
  woodDark: '#3E2723',
  woodMedium: '#5D4037',
  woodLight: '#8D6E63',
  gold: '#D4A017',
  goldDark: '#B8860B',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
} as const;

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
