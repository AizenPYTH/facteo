import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Button } from '@/components/ui/button';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

const ERROR_ICON = {
  ios: 'exclamationmark.triangle',
  android: 'warning',
  web: 'warning',
} as const satisfies SymbolName;

export type ErrorStateProps = {
  /** Message destiné à l'utilisateur — jamais le message technique brut. */
  message: string;
  title?: string;
  retryLabel?: string;
  onRetry?: () => void;
  /** Compact pour un bloc dans un écran, ample pour un écran entier. */
  variant?: 'block' | 'screen';
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * État d'erreur récupérable.
 *
 * Répond au constat de l'audit : aucun état d'erreur par requête n'existait, et
 * un échec réseau du tableau de bord se présentait comme « 0 € de chiffre
 * d'affaires ». Un échec doit se voir et proposer une reprise.
 */
export function ErrorState({
  message,
  title = 'Impossible de charger ces données',
  retryLabel = 'Réessayer',
  onRetry,
  variant = 'block',
  style,
  testID,
}: ErrorStateProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View
      accessibilityRole="alert"
      style={[styles.container, variant === 'screen' && styles.screen, style]}
      testID={testID}>
      <View style={styles.iconWrap}>
        <SymbolView name={ERROR_ICON} size={22} tintColor={colors.error} type="hierarchical" />
      </View>
      <Text maxFontSizeMultiplier={1.6} style={styles.title}>
        {title}
      </Text>
      <Text maxFontSizeMultiplier={1.6} style={styles.message}>
        {message}
      </Text>
      {onRetry ? (
        <Button accessibilityLabel={retryLabel} onPress={onRetry} title={retryLabel} variant="ghost" />
      ) : null}
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    container: {
      alignItems: 'center',
      gap: spacing[2],
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
    },
    screen: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: spacing['3xl'],
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.errorSubtle,
      marginBottom: spacing[1],
    },
    title: {
      ...typography.headline,
      color: colors.text,
      textAlign: 'center',
    },
    message: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  }));
