/**
 * INVEQ design system entry point.
 * Token modules live in ./theme/.
 */

import { Platform } from 'react-native';

import { colors, colorsDark, type ColorToken } from './theme/colors';
import { fontFamily } from './theme/typography';

export * from './theme/colors';
export * from './theme/spacing';
export * from './theme/radius';
export * from './theme/typography';
export * from './theme/design-system';
export {
  shadows,
  lightTheme,
  darkTheme,
  theme,
  type Theme,
  type ShadowToken,
} from './theme/theme';

/** Palette active helpers — prefer `useColors()` in components. */
export const lightPalette = colors;
export const darkPalette = colorsDark;

/** Keys usable with ThemedView / ThemedText background/text roles. */
export type ThemeColor = Extract<
  ColorToken,
  | 'text'
  | 'textSecondary'
  | 'background'
  | 'backgroundElement'
  | 'backgroundSelected'
  | 'surface'
  | 'primary'
>;

/** @deprecated Prefer `fontFamily` from the design system. */
export const Fonts = fontFamily;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
