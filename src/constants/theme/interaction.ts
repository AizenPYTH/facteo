/**
 * INVEQ Interaction Language
 *
 * Shared press / success / selection behavior.
 * Components compose these recipes — they do not invent their own.
 */

import * as Haptics from 'expo-haptics';

import { duration, spring } from './motion';
import { elevation } from './surfaces';

/** Pressable scale targets. */
export const press = {
  /** Cards, rows, tiles */
  card: {
    scale: 0.985,
    opacity: 1,
    duration: duration.instant,
    spring: spring.snappy,
    elevationRest: 1 as const,
    elevationPressed: 0 as const,
    haptic: 'selection' as const,
  },
  /** Primary / secondary buttons */
  button: {
    scale: 0.98,
    opacity: 1,
    duration: duration.instant,
    spring: spring.snappy,
    haptic: 'impactLight' as const,
  },
  /** Icon-only / chrome */
  chrome: {
    scale: 0.96,
    opacity: 0.72,
    duration: duration.instant,
    spring: spring.snappy,
    haptic: 'selection' as const,
  },
  /** List row (grouped) */
  row: {
    scale: 1,
    opacity: 0.55,
    backgroundHighlight: true,
    duration: duration.instant,
    haptic: 'selection' as const,
  },
} as const;

/** Success / error feedback recipe. */
export const feedback = {
  success: {
    toast: true,
    haptic: 'notificationSuccess' as const,
    autoDismissMs: 2800,
    icon: true,
  },
  error: {
    toast: true,
    haptic: 'notificationError' as const,
    autoDismissMs: 4200,
    icon: true,
  },
  selection: {
    toast: false,
    haptic: 'selection' as const,
  },
} as const;

/** Map recipe names → expo-haptics. */
export const hapticIntent = {
  selection: { type: 'selection' as const },
  impactLight: {
    type: 'impact' as const,
    style: Haptics.ImpactFeedbackStyle.Light,
  },
  impactMedium: {
    type: 'impact' as const,
    style: Haptics.ImpactFeedbackStyle.Medium,
  },
  notificationSuccess: {
    type: 'notification' as const,
    style: Haptics.NotificationFeedbackType.Success,
  },
  notificationError: {
    type: 'notification' as const,
    style: Haptics.NotificationFeedbackType.Error,
  },
} as const;

export const interactionLanguage = {
  press,
  feedback,
  hapticIntent,
  elevation,
  rules: [
    'Every tappable surface uses a press.* recipe.',
    'Never animate only opacity on cards — prefer scale + spring.',
    'Success always pairs toast + haptic; never one without the other for irreversible actions.',
    'If an animation has no communication purpose, delete it.',
  ],
} as const;

export type PressRecipe = keyof typeof press;
export type FeedbackRecipe = keyof typeof feedback;
