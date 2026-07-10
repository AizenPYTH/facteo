import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type ButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
};

export function Button({
  title,
  loading = false,
  variant = 'primary',
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => {
        const resolvedStyle = typeof style === 'function' ? style(state) : style;

        return [
          styles.base,
          isPrimary ? styles.primary : styles.ghost,
          state.pressed && !isDisabled && (isPrimary ? styles.primaryPressed : styles.ghostPressed),
          isDisabled && styles.disabled,
          resolvedStyle,
        ];
      }}
      {...props}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onPrimary : colors.primary} />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.ghostLabel]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.buttonPaddingHorizontal,
    paddingVertical: spacing.buttonPaddingVertical,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostPressed: {
    backgroundColor: colors.primarySubtle,
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
});
