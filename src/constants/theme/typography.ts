import { Platform, type TextStyle } from 'react-native';

/**
 * INVEQ typography — Inter, DESIGN.md §2.4.
 * Titres ≤ 600. Montants / SIRET / refs en tabular-nums.
 *
 * Sur native, chaque graisse est une famille distincte (@expo-google-fonts/inter).
 */

export const interFontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

export const fontFamily = Platform.select({
  ios: {
    sans: interFontFamily.regular,
    medium: interFontFamily.medium,
    semibold: interFontFamily.semibold,
    serif: 'Georgia',
    mono: 'Menlo',
    rounded: interFontFamily.regular,
  },
  default: {
    sans: interFontFamily.regular,
    medium: interFontFamily.medium,
    semibold: interFontFamily.semibold,
    serif: 'serif',
    mono: 'monospace',
    rounded: interFontFamily.regular,
  },
  web: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    medium: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    semibold: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: 'Menlo, Monaco, Consolas, monospace',
    rounded: 'Inter, system-ui, sans-serif',
  },
})!;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  /** Cap at 600 per DESIGN §2.4 */
  bold: '600',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const fontSize = {
  /** Titre d'écran 27–30 */
  largeTitle: 30,
  title1: 28,
  /** Titre de sheet 21–25 */
  title2: 23,
  title3: 21,
  /** Titre de section / ligne 15–17 */
  headline: 16,
  body: 15,
  callout: 15,
  subheadline: 15,
  /** Métadonnée 12–13 */
  footnote: 13,
  caption1: 12,
  /** Label de groupe 11 */
  caption2: 11,
  /** Montant en évidence 38–40 */
  amountHero: 40,
  /** Montant en ligne 15–16 */
  amount: 16,
} as const;

export const lineHeight = {
  largeTitle: 36,
  title1: 34,
  title2: 28,
  title3: 26,
  headline: 22,
  body: 22,
  callout: 22,
  subheadline: 20,
  footnote: 18,
  caption1: 16,
  caption2: 14,
  amountHero: 44,
  amount: 22,
} as const;

export const letterSpacing = {
  largeTitle: -0.025 * 30,
  title1: -0.025 * 28,
  title2: -0.02 * 23,
  title3: -0.015 * 21,
  headline: -0.01 * 16,
  body: 0,
  callout: 0,
  subheadline: 0,
  footnote: 0,
  caption1: 0,
  caption2: 0.09 * 11,
  amountHero: -0.02 * 40,
  amount: 0,
} as const;

function familyForWeight(weight: TextStyle['fontWeight']): string {
  if (weight === '500' || weight === 500) {
    return fontFamily.medium;
  }
  if (weight === '600' || weight === 600 || weight === '700' || weight === 700) {
    return fontFamily.semibold;
  }
  return fontFamily.sans;
}

function textStyle(
  variant: keyof typeof fontSize,
  weight: TextStyle['fontWeight'] = fontWeight.regular,
  extra?: TextStyle,
): TextStyle {
  return {
    fontFamily: familyForWeight(weight),
    fontSize: fontSize[variant],
    lineHeight: lineHeight[variant],
    letterSpacing: letterSpacing[variant],
    fontWeight: Platform.OS === 'web' ? weight : fontWeight.regular,
    ...extra,
  };
}

const tabular: TextStyle = {
  fontVariant: ['tabular-nums'],
};

export const typography = {
  largeTitle: textStyle('largeTitle', fontWeight.medium),
  title1: textStyle('title1', fontWeight.medium),
  title2: textStyle('title2', fontWeight.medium),
  title3: textStyle('title3', fontWeight.medium),
  headline: textStyle('headline', fontWeight.medium),
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
  caption2: textStyle('caption2', fontWeight.semibold),
  /** Label de groupe uppercase */
  groupLabel: {
    ...textStyle('caption2', fontWeight.semibold),
    textTransform: 'uppercase' as const,
  },
  /** Montant hero */
  amountHero: textStyle('amountHero', fontWeight.semibold, tabular),
  /** Montant en ligne */
  amount: textStyle('amount', fontWeight.semibold, tabular),
  /** Bouton primaire — 16/600 */
  buttonPrimary: textStyle('headline', fontWeight.semibold),
  /** Bouton secondaire — 15/500 */
  buttonSecondary: textStyle('body', fontWeight.medium),
  /** Puce de statut — 11/600 */
  statusChip: textStyle('caption2', fontWeight.semibold),
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.caption1,
    lineHeight: lineHeight.caption1,
    fontWeight: fontWeight.medium,
    fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
  },
} as const satisfies Record<string, TextStyle>;

export type TextHierarchy = 'display' | 'title' | 'subtitle' | 'body' | 'caption';

export const textHierarchy = {
  display: typography.largeTitle,
  title: typography.title2,
  subtitle: typography.subheadline,
  body: typography.body,
  caption: typography.footnote,
} as const satisfies Record<TextHierarchy, TextStyle>;

export type TypographyVariant = keyof typeof typography;
export type FontSizeToken = keyof typeof fontSize;
