import { colors, colorsDark } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';
import { shadows } from './surfaces';
import { fontFamily, typography } from './typography';

export { shadows } from './surfaces';
export type { ShadowToken } from './surfaces';

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
