import { Platform, type TextStyle } from 'react-native';

/**
 * INVEQ typography tokens — iOS Dynamic Type scale.
 */

export const fontFamily = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    mono: 'Menlo',
    rounded: 'System',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    mono: 'monospace',
    rounded: 'sans-serif',
  },
  web: {
    sans: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: 'Menlo, Monaco, Consolas, monospace',
    rounded: '-apple-system, BlinkMacSystemFont, "SF Pro Rounded", system-ui, sans-serif',
  },
})!;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const fontSize = {
  largeTitle: 34,
  title1: 28,
  title2: 22,
  title3: 20,
  headline: 17,
  body: 17,
  callout: 16,
  subheadline: 15,
  footnote: 13,
  caption1: 12,
  caption2: 11,
} as const;

export const lineHeight = {
  largeTitle: 41,
  title1: 34,
  title2: 28,
  title3: 25,
  headline: 22,
  body: 22,
  callout: 21,
  subheadline: 20,
  footnote: 18,
  caption1: 16,
  caption2: 13,
} as const;

export const letterSpacing = {
  largeTitle: 0.37,
  title1: 0.36,
  title2: 0.35,
  title3: 0.38,
  headline: -0.41,
  body: -0.41,
  callout: -0.32,
  subheadline: -0.24,
  footnote: -0.08,
  caption1: 0,
  caption2: 0.06,
} as const;

function textStyle(
  variant: keyof typeof fontSize,
  weight: TextStyle['fontWeight'] = fontWeight.regular,
): TextStyle {
  return {
    fontFamily: fontFamily.sans,
    fontSize: fontSize[variant],
    lineHeight: lineHeight[variant],
    letterSpacing: letterSpacing[variant],
    fontWeight: weight,
  };
}

export const typography = {
  largeTitle: textStyle('largeTitle', fontWeight.bold),
  title1: textStyle('title1', fontWeight.bold),
  title2: textStyle('title2', fontWeight.bold),
  title3: textStyle('title3', fontWeight.semibold),
  headline: textStyle('headline', fontWeight.semibold),
  body: textStyle('body', fontWeight.regular),
  bodyMedium: textStyle('body', fontWeight.medium),
  bodySemibold: textStyle('body', fontWeight.semibold),
  callout: textStyle('callout', fontWeight.regular),
  calloutMedium: textStyle('callout', fontWeight.medium),
  subheadline: textStyle('subheadline', fontWeight.regular),
  subheadlineMedium: textStyle('subheadline', fontWeight.medium),
  footnote: textStyle('footnote', fontWeight.regular),
  footnoteMedium: textStyle('footnote', fontWeight.medium),
  caption1: textStyle('caption1', fontWeight.regular),
  caption2: textStyle('caption2', fontWeight.regular),
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.caption1,
    lineHeight: lineHeight.caption1,
    fontWeight: fontWeight.medium,
  },
} as const satisfies Record<string, TextStyle>;

export type TextHierarchy =
  | 'display'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'caption';

export const textHierarchy = {
  /** Grand titre — écrans principaux */
  display: typography.largeTitle,
  /** Titre — sections et en-têtes */
  title: typography.title2,
  /** Sous-titre — descriptions courtes */
  subtitle: typography.subheadline,
  /** Texte — contenu principal */
  body: typography.body,
  /** Légende — métadonnées et labels secondaires */
  caption: typography.footnote,
} as const satisfies Record<TextHierarchy, TextStyle>;

export type TypographyVariant = keyof typeof typography;
export type FontSizeToken = keyof typeof fontSize;
