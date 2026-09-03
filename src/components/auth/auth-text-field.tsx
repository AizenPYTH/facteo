import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { useFieldNavigation } from '@/components/ui/form/form-navigation';
import { PressableScale } from '@/components/ui/pressable-scale';
import { components } from '@/constants/theme/design-system';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
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
  // Câble la ref, `returnKeyType` et `onSubmitEditing` — les écrans posaient un
  // `returnKeyType="next"` décoratif, sans ref pour enchaîner.
  const navigation = useFieldNavigation({ enabled: props.editable !== false });

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
          blurOnSubmit={navigation ? navigation.blurOnSubmit : false}
          onSubmitEditing={navigation?.onSubmitEditing}
          placeholderTextColor={colors.textPlaceholder}
          ref={navigation?.ref}
          returnKeyType={navigation?.returnKeyType}
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
          <PressableScale
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
          </PressableScale>
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
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    error: {
      ...typography.caption1,
      color: colors.error,
      marginLeft: spacing[0.5],
    },
  }));
}
