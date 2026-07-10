import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { typography } from '@/constants/theme/typography';

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function TextField({ label, error, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.textPlaceholder}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    ...typography.footnoteMedium,
    color: colors.textSecondary,
  },
  input: {
    ...typography.body,
    color: colors.text,
    padding: 0,
    margin: 0,
  },
  inputError: {
    color: colors.error,
  },
  error: {
    ...typography.caption1,
    color: colors.error,
  },
});
