import { Platform, type ViewStyle } from 'react-native';

import { colors, colorsDark } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';
import { fontFamily, typography } from './typography';

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

function shadow(
  offsetY: number,
  radius: number,
  opacity: number,
  elevation: number,
): ShadowStyle {
  return Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: { elevation },
    default: {},
  })!;
}

export const shadows = {
  none: {} satisfies ShadowStyle,
  xs: shadow(1, 2, 0.04, 1),
  sm: shadow(1, 3, 0.08, 2),
  md: shadow(2, 8, 0.1, 4),
  lg: shadow(4, 16, 0.12, 8),
  xl: shadow(8, 24, 0.16, 12),
  card: shadow(2, 12, 0.08, 3),
  floating: shadow(4, 20, 0.14, 6),
  sheet: shadow(8, 32, 0.18, 10),
} as const;

export const lightTheme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  fontFamily,
} as const;

export const darkTheme = {
  ...lightTheme,
  colors: colorsDark,
} as const;

export const theme = lightTheme;

export type Theme = typeof lightTheme;
export type ShadowToken = keyof typeof shadows;
