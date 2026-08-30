import { SymbolView } from 'expo-symbols';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type PremiumUpgradeBannerProps = {
  message?: string;
  compact?: boolean;
};

/**
 * DESIGN §5.10 : le point d'entrée renvoie toujours vers l'écran d'offre
 * complet (`settings/premium`) — jamais de paiement déclenché depuis un
 * bandeau inline. Ceci écarte aussi tout appel Stripe hors écran dédié sur
 * iOS (§1).
 */
export function PremiumUpgradeBanner({
  message = 'Disponible avec une offre supérieure',
  compact = false,
}: PremiumUpgradeBannerProps) {
  const styles = useStyles(compact);
  const colors = useColors();

  function handlePress() {
    router.push('/settings/premium' as Href);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${message}. Voir l’offre Premium`}
      onPress={handlePress}
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}>
      <SymbolView name="lock.fill" size={compact ? 12 : 14} tintColor={colors.primary} />
      <Text numberOfLines={2} style={styles.message}>
        {message}
      </Text>
      <Text style={styles.cta}>Débloquer</Text>
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
