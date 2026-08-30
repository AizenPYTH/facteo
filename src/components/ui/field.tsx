import { useState, type ReactNode } from 'react';
import {
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type FieldRequirement = 'required' | 'optional' | 'none';

type FieldProps = TextInputProps & {
  label?: string;
  error?: string;
  /** Affiche « requis » / « · facultatif » — DESIGN §3.3 */
  requirement?: FieldRequirement;
  leftIcon?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

/**
 * Champ autonome — DESIGN §3.3
 * hauteur 50, bordure 1px, r 11, label 12/600, erreur inline.
 */
export function Field({
  label,
  error,
  requirement = 'none',
  leftIcon,
  containerStyle,
  inputStyle,
  style,
  accessibilityLabel,
  onBlur,
  onFocus,
  ...props
}: FieldProps) {
  const styles = useStyles();
  const colors = useColors();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text maxFontSizeMultiplier={1.5} style={styles.label}>
            {label}
          </Text>
          {requirement === 'required' ? (
            <Text maxFontSizeMultiplier={1.5} style={styles.required}>
              {' '}
              requis
            </Text>
          ) : null}
          {requirement === 'optional' ? (
            <Text maxFontSizeMultiplier={1.5} style={styles.optional}>
              {' '}
              · facultatif
            </Text>
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.field,
          focused ? styles.fieldFocused : null,
          error ? styles.fieldError : null,
        ]}>
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label ?? props.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.textPlaceholder}
          style={[styles.input, inputStyle, style]}
          {...props}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
        />
      </View>

      {error ? (
        <Text accessibilityRole="alert" maxFontSizeMultiplier={1.5} style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Groupe de champs en carte unique avec séparateurs — DESIGN §3.3
 */
export function FieldGroup({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  return <View style={[styles.group, style]}>{children}</View>;
}

export function FieldGroupRow({
  label,
  requirement = 'none',
  error,
  children,
  isLast = false,
}: {
  label: string;
  requirement?: FieldRequirement;
  error?: string;
  children: ReactNode;
  isLast?: boolean;
}) {
  const styles = useStyles();

  return (
    <View style={[styles.groupRow, !isLast && styles.groupRowBorder]}>
      <View style={styles.labelRow}>
        <Text maxFontSizeMultiplier={1.5} style={styles.groupLabel}>
          {label}
        </Text>
        {requirement === 'required' ? (
          <Text maxFontSizeMultiplier={1.5} style={styles.required}>
            {' '}
            requis
          </Text>
        ) : null}
        {requirement === 'optional' ? (
          <Text maxFontSizeMultiplier={1.5} style={styles.optional}>
            {' '}
            · facultatif
          </Text>
        ) : null}
      </View>
      {children}
      {error ? (
        <Text accessibilityRole="alert" maxFontSizeMultiplier={1.5} style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      gap: spacing.xs,
    },
    labelRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
    },
    label: {
      ...typography.caption1,
      fontFamily: typography.caption2.fontFamily,
      fontWeight: typography.caption2.fontWeight,
      color: colors.textSecondary,
    },
    groupLabel: {
      ...typography.caption1,
      fontFamily: typography.caption2.fontFamily,
      fontWeight: typography.caption2.fontWeight,
      color: colors.textSecondary,
    },
    required: {
      ...typography.caption1,
      color: colors.error,
    },
    optional: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    field: {
      minHeight: components.inputHeight,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      paddingHorizontal: spacing.inputPadding,
      borderRadius: radius.input,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fieldFocused: {
      borderColor: colors.borderFocus,
    },
    fieldError: {
      borderColor: colors.error,
    },
    leftIcon: {
      justifyContent: 'center' as const,
    },
    input: {
      ...typography.body,
      color: colors.text,
      flex: 1,
      paddingVertical: spacing.group,
      margin: 0,
    },
    error: {
      ...typography.caption1,
      color: colors.error,
    },
    group: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden' as const,
    },
    groupRow: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.group,
      gap: spacing.xs,
    },
    groupRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
  }));
}
