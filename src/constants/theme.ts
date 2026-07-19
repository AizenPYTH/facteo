/**
 * Factume design system entry point.
 * Token modules live in ./theme/.
 */

import { Platform } from 'react-native';

import { legacyColors } from './theme/colors';
import { spacing } from './theme/spacing';
import { fontFamily } from './theme/typography';

export * from './theme/colors';
export * from './theme/spacing';
export * from './theme/radius';
export * from './theme/typography';
export {
  shadows,
  lightTheme,
  darkTheme,
  theme,
  type Theme,
  type ShadowToken,
} from './theme/theme';

/** @deprecated Use `legacyColors` or `colors` from the design system. */
export const Colors = legacyColors;

/** @deprecated Use `spacing` from the design system. */
export const Spacing = spacing;

/** @deprecated Use `fontFamily` from the design system. */
export const Fonts = fontFamily;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
