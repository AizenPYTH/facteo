import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

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

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${message}. Voir les offres`}
      onPress={() => router.push('/settings/premium' as Href)}
      intensity="subtle"
      style={styles.banner}>
      <SymbolView name="lock.fill" size={compact ? 12 : 14} tintColor={colors.primary} />
      <Text numberOfLines={2} style={styles.message}>
        {message}
      </Text>
      <Text style={styles.cta}>Voir les offres</Text>
    </PressableScale>
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
