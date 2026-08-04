/**
 * INVEQ color tokens — premium SaaS palette (violet → indigo → blue).
 * Primary: #4F46E5
 */

export const palette = {
  blue: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F2F2F7',
    200: '#E5E5EA',
    300: '#D1D1D6',
    400: '#C7C7CC',
    500: '#AEAEB2',
    600: '#8E8E93',
    700: '#636366',
    800: '#48484A',
    900: '#0B0E14',
  },
  white: '#FFFFFF',
  black: '#000000',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  yellow: '#FFCC00',
} as const;

export const colors = {
  primary: palette.blue[600],
  primaryHover: palette.blue[700],
  primaryPressed: palette.blue[800],
  primarySubtle: palette.blue[50],
  primaryMuted: palette.blue[100],
  onPrimary: palette.white,

  background: palette.white,
  backgroundSecondary: palette.gray[100],
  backgroundTertiary: palette.white,
  backgroundGrouped: palette.gray[100],
  backgroundElement: palette.gray[100],
  backgroundSelected: palette.gray[200],
  backgroundElevated: palette.white,

  surface: palette.white,
  surfaceSecondary: palette.gray[50],
  surfaceElevated: palette.white,

  text: palette.black,
  textSecondary: 'rgba(60, 60, 67, 0.6)',
  textTertiary: 'rgba(60, 60, 67, 0.3)',
  textQuaternary: 'rgba(60, 60, 67, 0.18)',
  textPlaceholder: 'rgba(60, 60, 67, 0.3)',
  textInverse: palette.white,
  textLink: palette.blue[600],

  border: palette.gray[200],
  borderStrong: palette.gray[300],
  borderFocus: palette.blue[600],
  separator: 'rgba(60, 60, 67, 0.29)',
  separatorOpaque: palette.gray[300],

  icon: palette.gray[900],
  iconSecondary: palette.gray[600],
  iconTertiary: palette.gray[500],
  iconInverse: palette.white,

  success: palette.green,
  successSubtle: '#E8F8ED',
  onSuccess: palette.white,

  warning: palette.orange,
  warningSubtle: '#FFF4E5',
  onWarning: palette.white,

  error: palette.red,
  errorSubtle: '#FFEBEA',
  onError: palette.white,

  info: palette.blue[600],
  infoSubtle: palette.blue[50],
  onInfo: palette.white,

  overlay: 'rgba(0, 0, 0, 0.4)',
  scrim: 'rgba(0, 0, 0, 0.32)',

  tabBar: 'rgba(255, 255, 255, 0.94)',
  tabBarBorder: palette.gray[200],
} as const;

/** iOS dark palette for existing color-scheme hooks. */
export const colorsDark = {
  primary: palette.blue[500],
  primaryHover: palette.blue[400],
  primaryPressed: palette.blue[600],
  primarySubtle: '#1A2A4A',
  primaryMuted: '#1E3A6E',
  onPrimary: palette.white,

  background: palette.black,
  backgroundSecondary: palette.gray[900],
  backgroundTertiary: '#2C2C2E',
  backgroundGrouped: palette.black,
  backgroundElement: '#212225',
  backgroundSelected: '#2E3135',
  backgroundElevated: '#1C1C1E',

  surface: '#1C1C1E',
  surfaceSecondary: palette.gray[900],
  surfaceElevated: '#2C2C2E',

  text: palette.white,
  textSecondary: 'rgba(235, 235, 245, 0.6)',
  textTertiary: 'rgba(235, 235, 245, 0.3)',
  textQuaternary: 'rgba(235, 235, 245, 0.18)',
  textPlaceholder: 'rgba(235, 235, 245, 0.3)',
  textInverse: palette.black,
  textLink: palette.blue[400],

  border: '#38383A',
  borderStrong: '#48484A',
  borderFocus: palette.blue[500],
  separator: 'rgba(84, 84, 88, 0.65)',
  separatorOpaque: '#38383A',

  icon: palette.white,
  iconSecondary: 'rgba(235, 235, 245, 0.6)',
  iconTertiary: 'rgba(235, 235, 245, 0.3)',
  iconInverse: palette.black,

  success: palette.green,
  successSubtle: '#1A3D24',
  onSuccess: palette.white,

  warning: palette.orange,
  warningSubtle: '#3D2A10',
  onWarning: palette.white,

  error: palette.red,
  errorSubtle: '#3D1A18',
  onError: palette.white,

  info: palette.blue[400],
  infoSubtle: '#1A2A4A',
  onInfo: palette.white,

  overlay: 'rgba(0, 0, 0, 0.6)',
  scrim: 'rgba(0, 0, 0, 0.48)',

  tabBar: 'rgba(28, 28, 30, 0.94)',
  tabBarBorder: '#38383A',
} as const;

export type GradientStops = readonly [string, string];

export type GradientTokens = {
  primary: GradientStops;
  primarySubtle: GradientStops;
};

/**
 * Brand gradients — same primary/blue identity, expressed as depth instead of
 * flat fills. Used for hero surfaces, accent bars, and premium affordances.
 * Additive only: never replaces a flat color token, only supplements it.
 */
export const gradients: GradientTokens = {
  primary: [palette.blue[600], palette.blue[500]],
  primarySubtle: [palette.blue[50], palette.white],
};

export const gradientsDark: GradientTokens = {
  primary: [palette.blue[500], palette.blue[400]],
  primarySubtle: ['#1A2A4A', palette.black],
};

/** Backward-compatible shape used by existing components. */
export const legacyColors = {
  light: {
    text: colors.text,
    background: colors.background,
    backgroundElement: colors.backgroundElement,
    backgroundSelected: colors.backgroundSelected,
    textSecondary: colors.textSecondary,
  },
  dark: {
    text: colorsDark.text,
    background: colorsDark.background,
    backgroundElement: colorsDark.backgroundElement,
    backgroundSelected: colorsDark.backgroundSelected,
    textSecondary: colorsDark.textSecondary,
  },
} as const;

export type ColorToken = keyof typeof colors;
export type PaletteColor = keyof typeof palette;
