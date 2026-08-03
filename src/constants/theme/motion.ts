/**
 * INVEQ Motion Language
 *
 * Principle: motion is communication, never decoration.
 * Prefer removing an animation over adding one “because it looks nice”.
 *
 * All screens / components MUST use these tokens — no ad-hoc durations.
 */

import { Easing } from 'react-native-reanimated';

/** Duration scale (ms). */
export const duration = {
  /** Micro feedback (press release, badge flip) */
  instant: 100,
  /** Controls, focus rings, color shifts */
  fast: 160,
  /** Default UI transitions */
  normal: 240,
  /** Entrances, sheet settle */
  slow: 360,
  /** Rare: splash, brand moments */
  deliberate: 480,
  /** Hard cap — never slower for routine UI */
  max: 560,
} as const;

/**
 * Easing — prefer springs for interactive UI; curves for opacity/color only.
 */
export const easing = {
  /** Opacity / color crossfades */
  standard: Easing.bezier(0.2, 0.0, 0.0, 1.0),
  /** Elements entering from rest */
  enter: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  /** Elements leaving */
  exit: Easing.bezier(0.4, 0.0, 1.0, 1.0),
} as const;

/**
 * Springs — interactive motion (press, sheets, list settle).
 * snappy = UI chrome; soft = content; gentle = large surfaces.
 */
export const spring = {
  snappy: { damping: 24, stiffness: 380, mass: 0.8 },
  soft: { damping: 22, stiffness: 220, mass: 1 },
  gentle: { damping: 26, stiffness: 160, mass: 1.1 },
} as const;

/** Open / close speeds for overlays. */
export const overlay = {
  openDuration: duration.normal,
  closeDuration: duration.fast,
  openSpring: spring.soft,
  closeSpring: spring.snappy,
} as const;

/** List & card entrance (stagger must stay subtle). */
export const entrance = {
  cardDuration: duration.normal,
  listItemDuration: duration.fast,
  /** Delay between consecutive list rows — keep ≤ 40ms */
  listStagger: 32,
  /** Max items to stagger (rest appear at once) */
  listStaggerMax: 8,
  cardSpring: spring.soft,
  fadeDuration: duration.fast,
} as const;

/** Navigation (stack / tabs). */
export const navigation = {
  pushDuration: duration.normal,
  popDuration: duration.fast,
  tabSwitchDuration: duration.fast,
} as const;

/**
 * @deprecated Prefer `duration` + `spring`. Kept for gradual migration.
 */
export const motion = {
  fast: duration.fast,
  normal: duration.normal,
  slow: duration.slow,
  splash: duration.deliberate,
  spring: spring.soft,
} as const;

export const motionLanguage = {
  duration,
  easing,
  spring,
  overlay,
  entrance,
  navigation,
} as const;

export type DurationToken = keyof typeof duration;
export type SpringToken = keyof typeof spring;
