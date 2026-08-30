import { Platform, type ViewStyle } from 'react-native';

import { colors, colorsDark } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';
import { fontFamily, typography } from './typography';

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

/**
 * Élévation — DESIGN §2.5 : trois niveaux seulement.
 * Sombre = bordure plus claire, pas d'ombre (appliqué côté composants).
 */
export const shadows = {
  none: {} satisfies ShadowStyle,
  /** Repos : aucune ombre (bordure 1px côté composant). */
  rest: {} satisfies ShadowStyle,
  /** Barre d'action / bottom sheet : 0 -8px 24px rgba(27,29,36,.06) */
  actionBar: Platform.select<ShadowStyle>({
    ios: {
      shadowColor: '#1B1D24',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
    default: {},
  })!,
  /** Modale : 0 20px 48px rgba(27,29,36,.22) */
  modal: Platform.select<ShadowStyle>({
    ios: {
      shadowColor: '#1B1D24',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.22,
      shadowRadius: 48,
    },
    android: { elevation: 16 },
    default: {},
  })!,
  /** Segmented active option — ombre 1px */
  segmented: Platform.select<ShadowStyle>({
    ios: {
      shadowColor: '#1B1D24',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {},
  })!,

  /** @deprecated aliases → niveaux DESIGN */
  xs: {} as ShadowStyle,
  sm: {} as ShadowStyle,
  md: Platform.select<ShadowStyle>({
    ios: {
      shadowColor: '#1B1D24',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
    default: {},
  })!,
  lg: Platform.select<ShadowStyle>({
    ios: {
      shadowColor: '#1B1D24',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.22,
      shadowRadius: 48,
    },
    android: { elevation: 16 },
    default: {},
  })!,
  xl: Platform.select<ShadowStyle>({
    ios: {
      shadowColor: '#1B1D24',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.22,
      shadowRadius: 48,
    },
    android: { elevation: 16 },
    default: {},
  })!,
  card: {} as ShadowStyle,
  floating: Platform.select<ShadowStyle>({
    ios: {
      shadowColor: '#1B1D24',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
    default: {},
  })!,
  sheet: Platform.select<ShadowStyle>({
    ios: {
      shadowColor: '#1B1D24',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
    default: {},
  })!,
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
