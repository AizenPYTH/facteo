import { ActivityIndicator, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { shadows } from '@/constants/theme/theme';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { triggerImpactHaptic } from '@/lib/haptics';

type ButtonProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
  /** Soft depth for primary CTAs (auth, sticky footers). */
  elevated?: boolean;
};

export function Button({
  title,
  loading = false,
  variant = 'primary',
  elevated = false,
  disabled,
  accessibilityLabel,
  style,
  onPress,
  ...props
}: ButtonProps) {
  const styles = useStyles();
  const colors = useColors();
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  return (
    <PressableScale
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
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        elevated && isPrimary && !isDisabled ? styles.elevated : null,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onPrimary : colors.primary} />
      ) : (
        <Text
          maxFontSizeMultiplier={1.5}
          style={[styles.label, isPrimary ? styles.primaryLabel : styles.ghostLabel]}>
          {title}
        </Text>
      )}
    </PressableScale>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  base: {
    minHeight: 52,
    borderRadius: radius.buttonLarge,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.buttonPaddingHorizontal,
    paddingVertical: spacing.buttonPaddingVertical,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  elevated: {
    ...shadows.md,
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.headline,
  },
  primaryLabel: {
    color: colors.onPrimary,
  },
  ghostLabel: {
    color: colors.primary,
  },
}));
}
