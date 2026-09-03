import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { useFieldNavigation } from '@/components/ui/form/form-navigation';
import { components } from '@/constants/theme/design-system';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  /** Exclut le champ de l'enchaînement clavier du formulaire. */
  skipFieldNavigation?: boolean;
};

/**
 * Champ de saisie canonique.
 *
 * S'inscrit automatiquement dans la chaîne de navigation du formulaire quand il
 * est rendu sous un `FormNavigationProvider` : « Suivant » enchaîne, le dernier
 * champ valide. Les props explicitement fournies par l'appelant restent
 * prioritaires sur ce câblage automatique.
 */
export function TextField({
  label,
  error,
  style,
  accessibilityLabel,
  skipFieldNavigation = false,
  ...props
}: TextFieldProps) {
  const styles = useStyles();
  const colors = useColors();
  const navigation = useFieldNavigation({
    multiline: props.multiline,
    enabled: !skipFieldNavigation && props.editable !== false,
  });

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
        placeholderTextColor={colors.textPlaceholder}
        ref={navigation?.ref}
        returnKeyType={navigation?.returnKeyType}
        blurOnSubmit={navigation ? navigation.blurOnSubmit : props.multiline === true}
        onSubmitEditing={navigation?.onSubmitEditing}
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
      minHeight: components.inputHeight,
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
