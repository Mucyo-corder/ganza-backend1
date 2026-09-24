// GANZA Premium Futuristic Design System
// Visual DNA extracted directly from GANZA icon: silver-blue metallic, steel tones, luminous highlights, deep navy ambient

export const COLORS = {
  background: '#050505',
  backgroundLight: '#111111',
  backgroundMid: '#171717',
  backgroundSoft: '#1F1F1F',

  surface: 'rgba(255,255,255,0.03)',
  surfaceLight: 'rgba(255,255,255,0.06)',
  surfaceStrong: 'rgba(255,255,255,0.10)',
  surfaceSolid: '#111111',
  surfaceLightSolid: '#1A1A1A',
  card: 'rgba(255,255,255,0.04)',
  cardSolid: '#141414',
  cardElevated: 'rgba(255,255,255,0.06)',

  border: 'rgba(255,255,255,0.10)',
  borderLight: 'rgba(255,255,255,0.14)',
  borderLuminous: 'rgba(255,255,255,0.16)',
  borderGlass: 'rgba(255,255,255,0.08)',

  silver: '#F5F5F5',
  silverLight: '#E5E5E5',
  silverBright: '#FFFFFF',
  silverDark: '#999999',
  silverMuted: '#B3B3B3',
  steel: '#707070',
  steelLight: '#8C8C8C',
  steelDark: '#404040',
  ice: '#F9F9F9',
  iceBlue: '#F1F1F1',

  primary: '#FFFFFF',
  primaryLight: '#F4F4F4',
  primaryMid: '#D9D9D9',
  primaryDark: '#B8B8B8',
  primaryDeep: '#121212',
  accent: '#1A1A1A',
  accentLight: '#6F6F6F',
  cyan: '#F0F0F0',
  luminous: '#FFFFFF',
  luminousBlue: '#F5F5F5',

  success: '#22C55E',
  successSoft: 'rgba(34,197,94,0.12)',
  successBorder: 'rgba(34,197,94,0.22)',
  error: '#EF4444',
  errorSoft: 'rgba(239,68,68,0.10)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245,158,11,0.12)',
  info: '#A3A3A3',
  infoSoft: 'rgba(163,163,163,0.10)',

  text: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#D4D4D4',
  textMuted: '#8B8B8B',
  textFaint: '#707070',
  cream: '#FFFFFF',
  creamLight: '#EDEDED',

  gold: '#EDEDED',
  goldDark: '#CFCFCF',
  woodDark: '#0B0B0B',
  woodMedium: '#171717',
  woodLight: '#1E1E1E',
  secondary: '#F3F3F3',
  secondaryLight: '#F7F7F7',
  primaryDarkLegacy: '#111111',
} as const;

// — Gradients — use with react-native-linear-gradient — //
export const GRADIENTS = {
  background: ['#050505', '#111111', '#1A1A1A'] as const,
  backgroundAmbient: ['#0E0E0E', '#171717', '#1F1F1F'] as const,
  metallicSilver: ['#FFFFFF', '#E7E7E7', '#BFBFBF', '#F5F5F5'] as const,
  metallicSilverSubtle: ['#F4F4F4', '#D9D9D9', '#8D8D8D'] as const,
  blueSteel: ['#F8F8F8', '#E2E2E2', '#BDBDBD'] as const,
  blueSteelSoft: ['#F8F8F8', '#E8E8E8', '#D3D3D3'] as const,
  primary: ['#FFFFFF', '#F0F0F0', '#DADADA'] as const,
  primarySoft: ['#F9F9F9', '#E9E9E9', '#D1D1D1'] as const,
  glassSheen: ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.00)'] as const,
  luminousEdge: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)'] as const,
  ambientBlue: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.00)'] as const,
  ambientCyan: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.00)'] as const,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 17,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  display: 42,
} as const;

export const FONT_WEIGHTS = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
} as const;

export const BORDER_RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 999,
} as const;

export const SHADOWS = {
  small: {
    shadowColor: '#020617',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 4,
  },
  medium: {
    shadowColor: '#020617',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  large: {
    shadowColor: '#020617',
    shadowOffset: {width: 0, height: 16},
    shadowOpacity: 0.45,
    shadowRadius: 32,
    elevation: 12,
  },
  // Luminous glow shadows (premium highlight)
  glowBlue: {
    shadowColor: '#3B82F6',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  glowSoft: {
    shadowColor: '#60A5FA',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 6,
  },
  // Glass inner highlight
  glass: {
    shadowColor: '#93C5FD',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.12,
    shadowRadius: 0,
    elevation: 2,
  },
} as const;

// — Glassmorphism presets — //
export const GLASS = {
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  cardStrong: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
  },
  subtle: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  luminous: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(176,208,255,0.16)',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
} as const;

// — Typography presets for luxury sans — //
export const TYPOGRAPHY = {
  display: {
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.black,
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  h1: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    letterSpacing: -0.6,
    lineHeight: 40,
  },
  h2: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  h3: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: 20,
  },
  caption: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
} as const;
