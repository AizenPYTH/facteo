import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type PremiumUpgradeBannerProps = {
  message?: string;
  compact?: boolean;
};

export function PremiumUpgradeBanner({
  message = 'Disponible avec INVEQ Premium',
  compact = false,
}: PremiumUpgradeBannerProps) {
  const styles = useStyles(compact);
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${message}. Ouvrir Premium`}
      onPress={() => router.push('/settings/premium' as Href)}
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}>
      <SymbolView name="lock.fill" size={compact ? 12 : 14} tintColor={colors.primary} />
      <Text numberOfLines={2} style={styles.message}>
        {message}
      </Text>
      <Text style={styles.cta}>Premium</Text>
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
