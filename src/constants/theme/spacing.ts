/**
 * FACTEO spacing tokens — 4pt grid, mobile-first.
 */

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,

  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,

  screenPadding: 16,
  screenPaddingHorizontal: 16,
  screenPaddingVertical: 16,
  sectionGap: 24,
  cardPadding: 16,
  listItemPadding: 16,
  inputPadding: 12,
  buttonPaddingHorizontal: 16,
  buttonPaddingVertical: 12,
  gutter: 16,

  /** @deprecated Use spacing[0.5] */
  half: 2,
  /** @deprecated Use spacing[1] */
  one: 4,
  /** @deprecated Use spacing[2] */
  two: 8,
  /** @deprecated Use spacing[4] */
  three: 16,
  /** @deprecated Use spacing[6] */
  four: 24,
  /** @deprecated Use spacing[8] */
  five: 32,
  /** @deprecated Use spacing[16] */
  six: 64,
} as const;

export type SpacingToken = keyof typeof spacing;
