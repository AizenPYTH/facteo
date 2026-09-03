import type { ReactNode } from 'react';
import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { duration, easing, stagger } from '@/constants/theme/motion';
import { useReduceMotion } from '@/hooks/use-reduce-motion';

export type StaggerInProps = {
  children: ReactNode;
  /** Rang de l'élément dans la séquence. Le délai en découle. */
  index?: number;
  /** Translation verticale de départ, en points. */
  offset?: number;
  style?: StyleProp<ViewStyle>;
};

const MAX_DELAY = 240;

/**
 * Apparition décalée d'une section.
 *
 * Volontairement écrit avec un `useSharedValue` piloté à la main plutôt qu'avec
 * les animations d'entrée de Reanimated : le worklet ne capture qu'un nombre,
 * et rien ne dépend du cycle de montage natif. C'est la même prudence que pour
 * `PressableScale` et `useCountUp`, après les plantages de démarrage en
 * release.
 *
 * Le délai est plafonné : au-delà de ~240 ms, la dernière section arrive
 * visiblement en retard et l'écran paraît lent.
 */
export function StaggerIn({ children, index = 0, offset = 12, style }: StaggerInProps) {
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }

    progress.value = withDelay(
      Math.min(index * stagger, MAX_DELAY),
      withTiming(1, { duration: duration.base, easing: easing.decelerate }),
    );
  }, [index, progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: offset * (1 - progress.value) }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
