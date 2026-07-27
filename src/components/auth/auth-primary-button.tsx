import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { triggerImpactHaptic } from '@/lib/haptics';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spring } from '@/constants/theme/motion';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { shadows } from '@/constants/theme/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type AuthPrimaryButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
};

/**
 * Physical primary CTA for auth — spring press, elevated depth, haptic.
 */
export function AuthPrimaryButton({
  title,
  loading = false,
  disabled,
  accessibilityLabel,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: AuthPrimaryButtonProps) {
  const styles = useStyles();
  const colors = useColors();
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={(event) => {
        if (!isDisabled) {
          void triggerImpactHaptic();
        }
        onPress?.(event);
      }}
      onPressIn={(event) => {
        if (!isDisabled) {
          scale.value = withSpring(0.97, spring.snappy);
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, spring.soft);
        onPressOut?.(event);
      }}
      style={[styles.base, isDisabled ? styles.disabled : null, animatedStyle]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <Text maxFontSizeMultiplier={1.5} style={styles.label}>
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    base: {
      minHeight: 56,
      borderRadius: radius.buttonLarge,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.buttonPaddingHorizontal,
      paddingVertical: spacing.buttonPaddingVertical,
      backgroundColor: colors.primary,
      ...shadows.lg,
      shadowColor: colors.primary,
      shadowOpacity: 0.42,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
    disabled: {
      opacity: 0.5,
    },
    label: {
      ...typography.headline,
      color: colors.onPrimary,
      letterSpacing: 0.2,
    },
  }));
}
