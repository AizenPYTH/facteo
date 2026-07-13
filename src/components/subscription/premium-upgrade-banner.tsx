import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePremiumCheckout } from '@/hooks/use-premium-checkout';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useToast } from '@/providers/toast-provider';

type PremiumUpgradeBannerProps = {
  message?: string;
  compact?: boolean;
};

export function PremiumUpgradeBanner({
  message = 'Disponible avec FACTEO Premium',
  compact = false,
}: PremiumUpgradeBannerProps) {
  const styles = useStyles(compact);
  const colors = useColors();
  const { startCheckout, subscribe, isConfigured } = usePremiumCheckout();
  const { showError, showSuccess } = useToast();

  async function handlePress() {
    if (!isConfigured) {
      showError('Stripe n’est pas encore configuré.');
      return;
    }

    try {
      const completed = await startCheckout();

      if (completed) {
        showSuccess('FACTEO Premium est activé.');
      }
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${message}. Débloquer Premium`}
      disabled={subscribe.isPending}
      onPress={() => {
        void handlePress();
      }}
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}>
      <SymbolView name="lock.fill" size={compact ? 12 : 14} tintColor={colors.primary} />
      <Text numberOfLines={2} style={styles.message}>
        {message}
      </Text>
      <Text style={styles.cta}>{subscribe.isPending ? 'Ouverture…' : 'Débloquer'}</Text>
    </Pressable>
  );
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Impossible d’ouvrir le paiement Stripe.';
}

function useStyles(compact: boolean) {
  return useThemedStyles((colors) => ({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: compact ? spacing.sm : spacing.md,
      paddingVertical: compact ? spacing.xs + 2 : spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.backgroundGrouped,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    pressed: {
      opacity: 0.88,
    },
    message: {
      flex: 1,
      ...typography.footnote,
      color: colors.textSecondary,
    },
    cta: {
      ...typography.footnoteMedium,
      color: colors.primary,
    },
  }));
}
