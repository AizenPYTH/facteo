import { forwardRef, useCallback } from 'react';
import { Pressable, type PressableProps, type View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { duration, easing, pressScale, spring } from '@/constants/theme/motion';
import { useReduceMotion } from '@/hooks/use-reduce-motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = PressableProps & {
  /** Intensité du retrait au toucher. */
  intensity?: keyof typeof pressScale;
  /** Atténuation d'opacité au toucher, en complément de l'échelle. */
  dimOnPress?: boolean;
};

/**
 * Primitive de retour tactile. Toute surface cliquable de l'app passe par ici :
 * cartes, tuiles, lignes de liste, boutons.
 *
 * L'animation vit sur le thread UI (Reanimated) et ne capture aucune valeur non
 * sérialisable, pour ne pas reproduire le crash de worklet rencontré en août.
 */
export const PressableScale = forwardRef<View, PressableScaleProps>(function PressableScale(
  { intensity = 'default', dimOnPress = false, style, onPressIn, onPressOut, ...rest },
  ref,
) {
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const target = 1 - (1 - pressScale[intensity]) * progress.value;
    return {
      transform: [{ scale: target }],
      opacity: dimOnPress ? 1 - 0.15 * progress.value : 1,
    };
  });

  const handlePressIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (event) => {
      progress.value = reduceMotion ? 0 : withTiming(1, { duration: duration.instant, easing: easing.standard });
      onPressIn?.(event);
    },
    [dimOnPress, intensity, onPressIn, progress, reduceMotion],
  );

  const handlePressOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (event) => {
      progress.value = reduceMotion ? 0 : withSpring(0, spring.snappy);
      onPressOut?.(event);
    },
    [onPressOut, progress, reduceMotion],
  );

  return (
    <AnimatedPressable
      ref={ref}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style as never]}
      {...rest}
    />
  );
});
