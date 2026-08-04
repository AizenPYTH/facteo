import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import {
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';

const SHIMMER_DURATION_MS = 1100;

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  cornerRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A loading placeholder block with a soft shimmer sweep. Compose several to
 * mirror the exact shape of the content being loaded (see `DashboardSkeleton`)
 * rather than a single generic spinner — this is what makes a loading state
 * feel considered instead of a placeholder.
 */
export function Skeleton({ width = '100%', height = 16, cornerRadius = radius.sm, style }: SkeletonProps) {
  const styles = useStyles();
  const colors = useColors();
  const measuredWidth = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: SHIMMER_DURATION_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [progress]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-measuredWidth.value, measuredWidth.value]) },
    ],
  }));

  return (
    <View
      onLayout={(event) => {
        // eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue mutation is safe here.
        measuredWidth.value = event.nativeEvent.layout.width;
      }}
      style={[styles.base, { width, height, borderRadius: cornerRadius }, style]}>
      <Animated.View style={[styles.sweep, shimmerStyle]}>
        <LinearGradient
          colors={[colors.border, colors.borderStrong, colors.border]}
          end={{ x: 1, y: 0 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

type SkeletonCircleProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** Circular skeleton for avatars/icons — same shimmer, radius pinned to a circle. */
export function SkeletonCircle({ size = 44, style }: SkeletonCircleProps) {
  return <Skeleton cornerRadius={size / 2} height={size} style={style} width={size} />;
}

function useStyles() {
  return useThemedStyles((colors) => ({
    base: {
      overflow: 'hidden',
      backgroundColor: colors.border,
    },
    sweep: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: '200%',
    },
  }));
}
