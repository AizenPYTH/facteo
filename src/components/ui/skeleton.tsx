import {
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  cornerRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Lot 03a isolation: static placeholder — no Reanimated shimmer on mount.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  cornerRadius = radius.sm,
  style,
}: SkeletonProps) {
  const styles = useStyles();

  return <View style={[styles.base, { width, height, borderRadius: cornerRadius }, style]} />;
}

type SkeletonCircleProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** Circular skeleton for avatars/icons. */
export function SkeletonCircle({ size = 44, style }: SkeletonCircleProps) {
  return <Skeleton cornerRadius={size / 2} height={size} style={style} width={size} />;
}

function useStyles() {
  return useThemedStyles((colors) => ({
    base: {
      overflow: 'hidden',
      backgroundColor: colors.border,
    },
  }));
}
