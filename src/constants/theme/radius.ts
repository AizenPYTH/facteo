/**
 * INVEQ border radius — DESIGN.md §2.5
 * 8 puce · 11 champ/bouton · 12–14 carte · 20–22 bottom sheet
 */

export const radius = {
  none: 0,
  xs: 6,
  sm: 8,
  md: 11,
  lg: 12,
  xl: 14,
  '2xl': 20,
  '3xl': 22,
  full: 9999,

  chip: 8,
  badge: 6,
  button: 12,
  buttonSmall: 11,
  buttonLarge: 12,
  input: 11,
  card: 14,
  sheet: 22,
  modal: 22,
  avatar: 9999,
  tab: 11,
  segmented: 11,
  filterChip: 9,
} as const;

export type RadiusToken = keyof typeof radius;
