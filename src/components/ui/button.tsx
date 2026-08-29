import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { triggerImpactHaptic } from '@/lib/haptics';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'destructive'
  | 'icon'
  /** @deprecated Use `tertiary`. Kept for migration. */
  | 'ghost';

type ButtonProps = Omit<PressableProps, 'children'> & {
  title?: string;
  loading?: boolean;
  variant?: ButtonVariant;
  /**
   * @deprecated DESIGN §2.5 n'autorise pas d'ombre sur le primaire.
   * Conservé no-op pour ne pas casser les call sites.
   */
  elevated?: boolean;
  /** Contenu pour `variant="icon"` (icône). */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

function resolveVariant(variant: ButtonVariant): Exclude<ButtonVariant, 'ghost'> {
  return variant === 'ghost' ? 'tertiary' : variant;
}

export function Button({
  title,
  loading = false,
  variant = 'primary',
  elevated: _elevated = false,
  disabled,
  accessibilityLabel,
  style,
  onPress,
  children,
  ...props
}: ButtonProps) {
  const styles = useStyles();
  const colors = useColors();
  const resolved = resolveVariant(variant);
  const isDisabled = disabled || loading;
  const isIcon = resolved === 'icon';
  const label = accessibilityLabel ?? title ?? (typeof children === 'string' ? children : undefined);

  const spinnerColor =
    resolved === 'primary'
      ? colors.onInk
      : resolved === 'destructive'
        ? colors.error
        : colors.primary;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={(event) => {
        if (!isDisabled) {
          void triggerImpactHaptic();
        }
        onPress?.(event);
      }}
      style={(state) => {
        const resolvedStyle = typeof style === 'function' ? style(state) : style;

        return [
          styles.base,
          styles[resolved],
          state.pressed && !isDisabled && styles[`${resolved}Pressed` as const],
          isDisabled && styles.disabled,
          resolvedStyle,
        ];
      }}
      {...props}>
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : isIcon ? (
        children
      ) : (
        <Text
          maxFontSizeMultiplier={1.5}
          style={[styles.label, styles[`${resolved}Label` as const]]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    base: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: spacing.buttonPaddingHorizontal,
    },
    primary: {
      minHeight: components.buttonHeight,
      borderRadius: radius.button,
      backgroundColor: colors.ink,
      paddingVertical: spacing.buttonPaddingVertical,
    },
    primaryPressed: {
      backgroundColor: colors.inkPressed,
      transform: [{ scale: 0.985 }],
    },
    primaryLabel: {
      ...typography.buttonPrimary,
      color: colors.onInk,
    },
    secondary: {
      minHeight: components.buttonHeightSecondary,
      borderRadius: radius.buttonSmall,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderControl,
      paddingVertical: spacing.group,
    },
    secondaryPressed: {
      backgroundColor: colors.surfaceSecondary,
    },
    secondaryLabel: {
      ...typography.buttonSecondary,
      color: colors.text,
    },
    tertiary: {
      minHeight: components.touchTarget,
      borderRadius: radius.buttonSmall,
      backgroundColor: 'transparent',
      paddingHorizontal: spacing.sm,
    },
    tertiaryPressed: {
      backgroundColor: colors.primarySubtle,
    },
    tertiaryLabel: {
      ...typography.buttonSecondary,
      color: colors.primary,
    },
    destructive: {
      minHeight: components.buttonHeightSecondary,
      borderRadius: radius.buttonSmall,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.destructiveBorder,
      paddingVertical: spacing.group,
    },
    destructivePressed: {
      backgroundColor: colors.errorSubtle,
    },
    destructiveLabel: {
      ...typography.buttonSecondary,
      color: colors.error,
    },
    icon: {
      width: components.iconButtonSize,
      height: components.iconButtonSize,
      minHeight: components.iconButtonSize,
      borderRadius: radius.buttonSmall,
      backgroundColor: colors.surfaceSecondary,
      paddingHorizontal: 0,
    },
    iconPressed: {
      backgroundColor: colors.border,
    },
    iconLabel: {
      ...typography.buttonSecondary,
      color: colors.text,
    },
    disabled: {
      opacity: 0.5,
    },
    label: {
      textAlign: 'center' as const,
    },
  }));
}

/** Helper visuel pour s'assurer qu'un seul primaire est rendu (documentation). */
export function ButtonRow({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, style]}>{children}</View>;
}
