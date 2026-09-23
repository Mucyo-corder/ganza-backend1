// GANZA Premium Futuristic Design System
// Visual DNA extracted directly from GANZA icon: silver-blue metallic, steel tones, luminous highlights, deep navy ambient

export const COLORS = {
  // — Deep sophisticated background — //
  background: '#040A1B',
  backgroundLight: '#091735',
  backgroundMid: '#0D2447',
  backgroundSoft: '#0F2A52',

  // — Glass surfaces (semi-transparent frosted glass) — //
  surface: 'rgba(255,255,255,0.06)',
  surfaceLight: 'rgba(255,255,255,0.10)',
  surfaceStrong: 'rgba(255,255,255,0.12)',
  surfaceSolid: '#0F1E38',
  surfaceLightSolid: '#162A4F',
  card: 'rgba(255,255,255,0.07)',
  cardSolid: '#0E1E3C',
  cardElevated: 'rgba(255,255,255,0.09)',

  // — Borders — luminous thin edges — //
  border: 'rgba(255,255,255,0.09)',
  borderLight: 'rgba(255,255,255,0.14)',
  borderLuminous: 'rgba(170,205,255,0.18)',
  borderGlass: 'rgba(255,255,255,0.08)',

  // — Metallic silver-blue palette — extracted from GANZA icon — //
  silver: '#CBD8E6',
  silverLight: '#EAF2FD',
  silverBright: '#F3F8FF',
  silverDark: '#8EA0B5',
  silverMuted: '#9FB2C6',
  steel: '#6B84A0',
  steelLight: '#8EA7C4',
  steelDark: '#4A6280',
  ice: '#F0F7FF',
  iceBlue: '#DCEBFF',

  // — Primary accent — GANZA blue (exact icon blue) — //
  primary: '#2B7FFF',
  primaryLight: '#60A5FA',
  primaryMid: '#3B82F6',
  primaryDark: '#1D4EA3',
  primaryDeep: '#14366F',
  accent: '#38BDF8',
  accentLight: '#7DD3FC',
  cyan: '#22D3EE',
  luminous: '#EAF6FF',
  luminousBlue: '#B8D4FF',

  // — Semantic — cool premium tones — //
  success: '#10B981',
  successSoft: 'rgba(16,185,129,0.12)',
  successBorder: 'rgba(16,185,129,0.22)',
  error: '#EF4444',
  errorSoft: 'rgba(239,68,68,0.10)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245,158,11,0.12)',
  info: '#38BDF8',
  infoSoft: 'rgba(56,189,248,0.10)',

  // — Text — high contrast on dark glass — //
  text: '#F1F6FF',
  textPrimary: '#F1F6FF',
  textSecondary: '#8FA2BB',
  textMuted: '#5E728C',
  textFaint: '#3E526B',
  cream: '#F1F6FF',
  creamLight: '#EAF2FD',

  // — Legacy compatibility (mapped to premium palette) — //
  gold: '#3B82F6',
  goldDark: '#2563EB',
  woodDark: '#0A1930',
  woodMedium: '#0F2447',
  woodLight: '#162A4F',
  secondary: '#38BDF8',
  secondaryLight: '#7DD3FC',
  primaryDarkLegacy: '#1D4EA3',
} as const;

// — Gradients — use with react-native-linear-gradient — //
export const GRADIENTS = {
  // Background: deep navy with ambient blue glow
  background: ['#040A1B', '#0A1930', '#0D2452'] as const,
  backgroundAmbient: ['#050D22', '#0A1F3D', '#102A52'] as const,
  // Metallic silver gradient extracted from GANZA icon
  metallicSilver: ['#F3F8FF', '#D8E6F5', '#A9BFD3', '#CBD8E6', '#EAF2FD'] as const,
  metallicSilverSubtle: ['#EAF2FD', '#CBD8E6', '#8EA0B5'] as const,
  // Blue steel gradient (icon highlight)
  blueSteel: ['#60A5FA', '#3B82F6', '#1E40AF'] as const,
  blueSteelSoft: ['#93C5FD', '#60A5FA', '#3B82F6'] as const,
  // Primary CTA gradient
  primary: ['#60A5FA', '#3B82F6', '#2563EB'] as const,
  primarySoft: ['#7DD3FC', '#38BDF8', '#3B82F6'] as const,
  // Glass sheen overlay
  glassSheen: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.00)'] as const,
  // Card luminous edge
  luminousEdge: ['rgba(180,210,255,0.18)', 'rgba(255,255,255,0.06)'] as const,
  // Ambient glow (for background orbs)
  ambientBlue: ['rgba(59,130,246,0.25)', 'rgba(59,130,246,0.00)'] as const,
  ambientCyan: ['rgba(56,189,248,0.18)', 'rgba(56,189,248,0.00)'] as const,
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
