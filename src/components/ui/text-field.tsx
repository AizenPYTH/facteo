import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function TextField({ label, error, style, accessibilityLabel, ...props }: TextFieldProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.container}>
      {label ? (
        <Text maxFontSizeMultiplier={1.5} style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        accessibilityLabel={accessibilityLabel ?? label ?? props.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        blurOnSubmit={props.multiline ? true : false}
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

function useStyles() {
  return useThemedStyles((colors) => ({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.footnoteMedium,
    color: colors.textSecondary,
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
