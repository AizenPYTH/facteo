/**
 * INVEQ Component Language
 *
 * Official catalog. New UI must map to a role below or propose a token change —
 * do not invent one-off variants.
 */

import { duration, overlay, spring } from './motion';
import { press } from './interaction';
import { radius } from './radius';
import { spacing } from './spacing';
import { elevation, surface } from './surfaces';

export const componentLanguage = {
  button: {
    height: 48,
    heightCompact: 40,
    radius: radius.button,
    press: press.button,
    variants: ['primary', 'secondary', 'ghost', 'destructive'] as const,
  },
  card: {
    surface: surface.card,
    press: press.card,
    radius: radius.card,
    padding: spacing.cardPadding,
    /** Same recipe for dashboard / client / invoice / quote */
    family: 'surface.card + elevation[1]',
  },
  input: {
    height: 48,
    radius: radius.input,
    paddingHorizontal: spacing.md,
    /** Contained field — never bare underline-only in product UI */
    contained: true,
    focusDuration: duration.fast,
  },
  badge: {
    radius: radius.badge,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing[1],
    typographyRole: 'badge' as const,
  },
  dialog: {
    radius: radius.modal,
    elevation: 4 as const,
    open: overlay.openSpring,
    closeDuration: overlay.closeDuration,
  },
  bottomSheet: {
    surface: surface.sheet,
    openSpring: spring.soft,
    closeSpring: spring.snappy,
    dismissHaptic: 'selection' as const,
  },
  toast: {
    elevation: 3 as const,
    radius: radius.lg,
    enterSpring: spring.snappy,
    exitDuration: duration.fast,
    successDismissMs: 2800,
    errorDismissMs: 4200,
  },
  dropdown: {
    radius: radius.lg,
    elevation: 3 as const,
    openDuration: duration.fast,
  },
  fab: {
    size: 56,
    radius: radius.full,
    elevation: 3 as const,
    press: press.button,
  },
  search: {
    height: 44,
    radius: radius.full,
    surface: 'inset' as const,
  },
  emptyState: {
    iconSize: 28,
    iconWell: 56,
    gap: spacing.md,
    cta: 'primary' as const,
  },
  loading: {
    /** Prefer skeleton; spinner only for inline / unknown structure */
    preferSkeleton: true,
    spinnerSize: 'small' as const,
  },
  skeleton: {
    radius: radius.sm,
    pulseDuration: 1200,
    baseOpacity: 0.08,
    peakOpacity: 0.18,
  },
} as const;

export type ComponentToken = keyof typeof componentLanguage;
