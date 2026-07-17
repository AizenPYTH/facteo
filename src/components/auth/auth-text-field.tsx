import { SymbolView } from 'expo-symbols';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useState } from 'react';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type AuthTextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  icon: React.ComponentProps<typeof SymbolView>['name'];
  isPassword?: boolean;
};

export function AuthTextField({
  label,
  error,
  icon,
  isPassword = false,
  style,
  accessibilityLabel,
  onBlur,
  onFocus,
  ...props
}: AuthTextFieldProps) {
  const styles = useStyles();
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(isPassword);

  return (
    <View style={styles.container}>
      <Text maxFontSizeMultiplier={1.5} style={styles.label}>
        {label}
      </Text>
      <View
        style={[
          styles.field,
          focused ? styles.fieldFocused : null,
          error ? styles.fieldError : null,
        ]}>
        <SymbolView
          name={icon}
          size={18}
          style={styles.icon}
          tintColor={focused ? colors.primary : colors.iconSecondary}
          type="hierarchical"
        />
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.textPlaceholder}
          style={[styles.input, style]}
          {...props}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          secureTextEntry={isPassword ? secure : false}
        />
        {isPassword ? (
          <Pressable
            accessibilityLabel={secure ? 'Afficher le mot de passe' : 'Masquer le mot de passe'}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setSecure((value) => !value)}
            style={styles.trailingButton}>
            <SymbolView
              name={secure ? 'eye' : 'eye.slash'}
              size={18}
              tintColor={colors.iconSecondary}
              type="hierarchical"
            />
          </Pressable>
        ) : null}
      </View>
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
      gap: spacing[1.5],
    },
    label: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
      marginLeft: spacing[0.5],
    },
    field: {
      minHeight: components.inputHeight + 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    fieldFocused: {
      borderColor: colors.borderFocus,
      backgroundColor: colors.surface,
    },
    fieldError: {
      borderColor: colors.error,
    },
    icon: {
      marginTop: 1,
    },
    input: {
      ...typography.body,
      color: colors.text,
      flex: 1,
      paddingVertical: spacing.sm + 2,
      margin: 0,
    },
    trailingButton: {
      padding: spacing.xs,
    },
    error: {
      ...typography.caption1,
      color: colors.error,
      marginLeft: spacing[0.5],
    },
  }));
}
