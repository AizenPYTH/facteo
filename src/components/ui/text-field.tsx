import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { Field } from '@/components/ui/field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type TextFieldRequirement = 'required' | 'optional' | 'none';

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  /** Affiche « requis » / « · facultatif » — DESIGN §3.3 */
  requirement?: TextFieldRequirement;
};

/**
 * Champ legacy (sans bordure autonome) — préférer `Field` (DESIGN §3.3).
 * Conservé pour les formulaires en groupe de lignes existants.
 */
export function TextField({
  label,
  error,
  requirement = 'none',
  style,
  accessibilityLabel,
  ...props
}: TextFieldProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.container}>
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
      <TextInput
        accessibilityLabel={accessibilityLabel ?? label ?? props.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.textPlaceholder}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? (
        <Text accessibilityRole="alert" maxFontSizeMultiplier={1.5} style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export { Field };

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
    input: {
      ...typography.body,
      color: colors.text,
      minHeight: 44,
      paddingVertical: spacing.sm,
      paddingHorizontal: 0,
      margin: 0,
    },
    inputError: {
      color: colors.error,
    },
    error: {
      ...typography.caption1,
      color: colors.error,
    },
  }));
}
