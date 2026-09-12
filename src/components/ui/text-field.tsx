import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  /** Texte d'aide sous le champ. */
  hint?: string;
};

/**
 * Champ de saisie de l'app.
 *
 * Deux points volontairement traités ici plutôt que sur chaque écran :
 * - `submitBehavior` remplace `blurOnSubmit` (déprécié). Sur un champ multiligne,
 *   la touche Entrée doit insérer un retour à la ligne, pas fermer le clavier :
 *   c'est ce qui rendait les descriptions impossibles à saisir sur plusieurs lignes.
 * - `autoCapitalize` par défaut à `sentences` : les champs de l'app sont d'abord
 *   du texte en français (titre de prestation, description, notes, adresse).
 *   Les champs techniques (e-mail, IBAN…) passent explicitement `none`.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, style, accessibilityLabel, multiline, ...props },
  ref,
) {
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
        {...props}
        accessibilityLabel={accessibilityLabel ?? label ?? props.placeholder}
        autoCapitalize={props.autoCapitalize ?? 'sentences'}
        autoCorrect={props.autoCorrect ?? false}
        multiline={multiline}
        placeholderTextColor={props.placeholderTextColor ?? colors.textPlaceholder}
        ref={ref}
        style={[
          styles.input,
          multiline ? styles.inputMultiline : null,
          error ? styles.inputError : null,
          style,
        ]}
        submitBehavior={props.submitBehavior ?? (multiline ? 'newline' : 'blurAndSubmit')}
      />
      {error ? (
        <Text accessibilityRole="alert" maxFontSizeMultiplier={1.5} style={styles.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text maxFontSizeMultiplier={1.5} style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

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
    inputMultiline: {
      minHeight: 72,
      textAlignVertical: 'top',
    },
    inputError: {
      color: colors.error,
    },
    error: {
      ...typography.caption1,
      color: colors.error,
    },
    hint: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
  }));
}
