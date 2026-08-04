import type { WithSpringConfig } from 'react-native-reanimated';

import { motion } from '@/constants/theme/design-system';

/**
 * INVEQ spring presets — reused everywhere a physical, non-linear motion is
 * needed (press feedback, entrances, sheets). Built on the base `motion.spring`
 * token so every "gentle" spring across the app shares the same feel.
 */
export const springs = {
  /** Default feel: card entrances, sheet open/close, content reveals. */
  gentle: {
    damping: motion.spring.damping,
    stiffness: motion.spring.stiffness,
    mass: 1,
  } satisfies WithSpringConfig,
  /** Press feedback: quick settle, no overshoot — buttons, cards, tiles. */
  snappy: {
    damping: 22,
    stiffness: 320,
    mass: 0.9,
  } satisfies WithSpringConfig,
  /** Celebratory / attention moments: count-up settle, success states. */
  bouncy: {
    damping: 12,
    stiffness: 200,
    mass: 1,
  } satisfies WithSpringConfig,
} as const;

export type SpringPreset = keyof typeof springs;
