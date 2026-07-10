/**
 * FACTEO design system entry point.
 * Token modules live in ./theme/.
 */

import { Platform } from 'react-native';

export * from './theme/colors';
export * from './theme/spacing';
export * from './theme/radius';
export * from './theme/typography';
export * from './theme/theme';

import { legacyColors } from './theme/colors';
import { fontFamily } from './theme/typography';
import { spacing } from './theme/spacing';

/** @deprecated Use `legacyColors` or `colors` from the design system. */
export const Colors = legacyColors;

/** @deprecated Use `spacing` from the design system. */
export const Spacing = spacing;

/** @deprecated Use `fontFamily` from the design system. */
export const Fonts = fontFamily;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
