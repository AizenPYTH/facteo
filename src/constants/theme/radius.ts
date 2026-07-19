/**
 * Factume border radius tokens — rounded, iOS-inspired corners.
 */

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,

  button: 12,
  buttonSmall: 8,
  buttonLarge: 14,

  input: 12,
  card: 16,
  sheet: 20,
  modal: 24,
  badge: 8,
  chip: 20,
  avatar: 9999,
  tab: 10,
} as const;

export type RadiusToken = keyof typeof radius;
