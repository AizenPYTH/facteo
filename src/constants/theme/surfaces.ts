/**
 * INVEQ Surface Language
 *
 * One family of surfaces for Dashboard, Clients, Invoices, Quotes.
 * Depth = elevation + background hierarchy — not random borders.
 */

import { Platform, StyleSheet, type ViewStyle } from 'react-native';

import { radius } from './radius';
import { spacing } from './spacing';

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

function shadow(
  offsetY: number,
  blur: number,
  opacity: number,
  elevationValue: number,
): ShadowStyle {
  return Platform.select({
    ios: {
      shadowColor: '#0B0E14',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: blur,
    },
    android: { elevation: elevationValue },
    default: {},
  })!;
}

/**
 * Elevation ladder — use only these levels.
 * 0 flat · 1 resting card · 2 raised · 3 floating (FAB, toast) · 4 sheet
 */
export const elevation = {
  0: { ...shadow(0, 0, 0, 0) },
  1: { ...shadow(1, 8, 0.06, 2) },
  2: { ...shadow(2, 12, 0.08, 3) },
  3: { ...shadow(4, 20, 0.12, 6) },
  4: { ...shadow(8, 32, 0.16, 10) },
} as const;

/** Compat aliases — prefer `elevation[n]`. */
export const shadows = {
  none: elevation[0],
  xs: elevation[1],
  sm: elevation[1],
  md: elevation[2],
  lg: elevation[3],
  xl: elevation[4],
  card: elevation[1],
  floating: elevation[3],
  sheet: elevation[4],
} as const;

export type SurfaceRole =
  | 'canvas'
  | 'grouped'
  | 'card'
  | 'cardRaised'
  | 'inset'
  | 'overlay'
  | 'sheet';

/**
 * Surface recipes — every card type maps to one of these.
 * Dashboard / Client / Invoice / Quote cards → `card`.
 */
export const surface = {
  canvas: {
    backgroundToken: 'background' as const,
    radius: radius.none,
    borderWidth: 0,
    elevation: 0 as const,
  },
  grouped: {
    backgroundToken: 'backgroundGrouped' as const,
    radius: radius.none,
    borderWidth: 0,
    elevation: 0 as const,
  },
  card: {
    backgroundToken: 'surface' as const,
    radius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColorToken: 'border' as const,
    elevation: 1 as const,
    padding: spacing.cardPadding,
  },
  cardRaised: {
    backgroundToken: 'surface' as const,
    radius: radius.card,
    borderWidth: 0,
    elevation: 2 as const,
    padding: spacing.cardPadding,
  },
  inset: {
    backgroundToken: 'surface' as const,
    radius: radius.lg,
    borderWidth: 0,
    elevation: 0 as const,
    padding: 0,
  },
  overlay: {
    backgroundToken: 'overlay' as const,
    opacity: 0.4,
    radius: radius.none,
    elevation: 0 as const,
  },
  sheet: {
    backgroundToken: 'surfaceElevated' as const,
    radius: radius.sheet,
    borderWidth: 0,
    elevation: 4 as const,
    padding: spacing.lg,
  },
} as const;

export const material = {
  navBar: {
    ios: 'ultraThinMaterial' as const,
    fallbackBackgroundToken: 'backgroundElevated' as const,
  },
  sheet: {
    ios: 'chromeMaterial' as const,
    fallbackBackgroundToken: 'surfaceElevated' as const,
  },
} as const;

export const surfaceLanguage = {
  elevation,
  surface,
  material,
  radius: {
    card: radius.card,
    button: radius.button,
    input: radius.input,
    badge: radius.badge,
    sheet: radius.sheet,
    modal: radius.modal,
    fab: radius.full,
  },
  rule: 'Dashboard, Client, and Document cards all use surface.card + elevation[1].',
} as const;

export type ElevationLevel = keyof typeof elevation;
export type ShadowToken = keyof typeof shadows;
