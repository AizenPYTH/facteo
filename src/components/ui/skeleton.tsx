import { useEffect } from 'react';
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { duration, easing } from '@/constants/theme/motion';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { useColors } from '@/hooks/use-colors';

export type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  /** Rayon du bloc. `full` pour les avatars et pastilles. */
  rounded?: keyof typeof radius;
  style?: StyleProp<ViewStyle>;
};

/**
 * Bloc de chargement. Remplace les écrans vides à spinner : on montre la forme
 * du contenu à venir, pas un indicateur abstrait.
 *
 * L'animation est une simple pulsation d'opacité sur le thread UI — aucune
 * capture de valeur non sérialisable dans le worklet.
 */
export function Skeleton({ width = '100%', height = 16, rounded = 'sm', style }: SkeletonProps) {
  const colors = useColors();
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 0.5;
      return;
    }

    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: duration.slow * 2, easing: easing.standard }),
      -1,
      true,
    );
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + 0.35 * progress.value,
  }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: radius[rounded], backgroundColor: colors.backgroundSecondary },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Bloc de plusieurs lignes de texte, la dernière volontairement plus courte. */
export function SkeletonText({
  lines = 3,
  lineHeight = 14,
  gap = spacing[2],
  style,
}: {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          height={lineHeight}
          key={index}
          width={index === lines - 1 ? '62%' : '100%'}
        />
      ))}
    </View>
  );
}
