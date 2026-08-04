import { FadeInDown } from 'react-native-reanimated';

import { motion } from '@/constants/theme/design-system';

/** Base delay step between successive items in a staggered entrance. */
const STAGGER_STEP_MS = 60;
/** Cap so long lists don't feel sluggish to appear. */
const STAGGER_MAX_MS = 360;

/**
 * Delay (ms) for the Nth item in a staggered entrance sequence.
 * Centralizing this avoids each screen inventing its own magic numbers.
 */
export function staggerDelay(index: number, step: number = STAGGER_STEP_MS): number {
  return Math.min(index * step, STAGGER_MAX_MS);
}

type FadeInUpOptions = {
  /** Item index in the sequence — controls the stagger delay. */
  index?: number;
  /** Override the delay step between items. */
  step?: number;
  /** Override the animation duration. */
  duration?: number;
};

/**
 * Standard "content reveal" entrance: fade + rise, spring-settled.
 * Use for cards, sections, and list items appearing on screen mount.
 */
export function fadeInUp({ index = 0, step, duration = motion.normal }: FadeInUpOptions = {}) {
  return FadeInDown.delay(staggerDelay(index, step))
    .duration(duration)
    .springify()
    .damping(motion.spring.damping)
    .stiffness(motion.spring.stiffness);
}
