import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text } from 'react-native';

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
  message = 'Disponible avec une offre supérieure',
  compact = false,
}: PremiumUpgradeBannerProps) {
  const styles = useStyles(compact);
  const colors = useColors();
  const { startCheckout, subscribe } = usePremiumCheckout();
  const { showError } = useToast();

  async function handlePress() {
    try {
      await startCheckout();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Impossible d’ouvrir le site.');
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${message}. Voir les offres`}
      disabled={subscribe.isPending}
      onPress={() => {
        void handlePress();
      }}
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}>
      <SymbolView name="lock.fill" size={compact ? 12 : 14} tintColor={colors.primary} />
      <Text numberOfLines={2} style={styles.message}>
        {message}
      </Text>
      <Text style={styles.cta}>{subscribe.isPending ? 'Ouverture…' : 'Voir offres'}</Text>
    </Pressable>
  );
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
