/**
 * INVEQ spacing — échelle stricte DESIGN.md §2.5 : 4 / 8 / 12 / 16 / 24 / 32.
 * Aucune valeur hors échelle pour le nouveau code.
 *
 * Exception documentée : actionBarPaddingBottom = 10 (DESIGN §3.2).
 */

const SCALE = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  24: 24,
  32: 32,
} as const;

export const spacing = {
  0: 0,
  ...SCALE,

  /** Alias numériques historiques → échelle (évite hors-échelle). */
  1: SCALE[4],
  2: SCALE[8],
  3: SCALE[12],
  4: SCALE[16],
  5: SCALE[16],
  6: SCALE[24],
  7: SCALE[24],
  8: SCALE[32],
  9: SCALE[32],
  10: SCALE[32],

  /** Alias nommés — uniquement sur l'échelle. */
  xs: SCALE[4],
  sm: SCALE[8],
  md: SCALE[16],
  lg: SCALE[24],
  xl: SCALE[32],
  /** @deprecated Prefer `spacing.xl` (échelle max 32). */
  '2xl': SCALE[32],
  /** @deprecated Prefer `spacing.xl` (échelle max 32). */
  '3xl': SCALE[32],
  /** @deprecated Prefer `spacing.xl` (échelle max 32). */
  '4xl': SCALE[32],

  /** 12px — gap / group label spacing */
  group: SCALE[12],

  screenPadding: SCALE[16],
  screenPaddingHorizontal: SCALE[16],
  screenPaddingVertical: SCALE[16],
  sectionGap: SCALE[24],
  cardPadding: SCALE[16],
  listItemPadding: SCALE[16],
  inputPadding: SCALE[12],
  buttonPaddingHorizontal: SCALE[16],
  buttonPaddingVertical: SCALE[12],
  gutter: SCALE[16],

  /** Action bar padding — DESIGN §3.2 (`12px 16px 10px`) */
  actionBarPaddingTop: SCALE[12],
  actionBarPaddingBottom: 10,
  actionBarPaddingHorizontal: SCALE[16],
} as const;

export type SpacingToken = keyof typeof spacing;
