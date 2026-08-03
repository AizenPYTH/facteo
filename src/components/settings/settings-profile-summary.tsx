import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useGradients, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type SettingsProfileSummaryProps = {
  companyName?: string | null;
  email?: string | null;
  planLabel: string;
  isPremium?: boolean;
  onPressPlan?: () => void;
};

export function SettingsProfileSummary({
  companyName,
  email,
  planLabel,
  isPremium = false,
  onPressPlan,
}: SettingsProfileSummaryProps) {
  const styles = useStyles();
  const gradients = useGradients();
  const displayName = companyName?.trim() || 'Entreprise';

  const badgeContent = isPremium ? (
    <LinearGradient
      colors={gradients.primary}
      end={{ x: 1, y: 0 }}
      start={{ x: 0, y: 0 }}
      style={styles.planBadge}>
      <Text style={styles.planLabelOnGradient}>{planLabel}</Text>
    </LinearGradient>
  ) : (
    <View style={[styles.planBadge, styles.planBadgeNeutral]}>
      <Text style={styles.planLabel}>{planLabel}</Text>
    </View>
  );

  return (
    <View style={styles.card}>
      <Text numberOfLines={2} style={styles.companyName}>
        {displayName}
      </Text>
      <Text numberOfLines={1} style={styles.email}>
        {email ?? '—'}
      </Text>
      {onPressPlan ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPressPlan}
          style={({ pressed }) => [styles.pressWrap, pressed && styles.pressed]}>
          {badgeContent}
        </Pressable>
      ) : (
        badgeContent
      )}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    card: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    companyName: {
      ...typography.title3,
      color: colors.text,
    },
    email: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    pressWrap: {
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
    },
    pressed: {
      opacity: 0.88,
    },
    planBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.chip,
    },
    planBadgeNeutral: {
      marginTop: spacing.xs,
      backgroundColor: colors.backgroundGrouped,
      borderWidth: 1,
      borderColor: colors.border,
    },
    planLabelOnGradient: {
      ...typography.footnoteMedium,
      color: colors.onPrimary,
    },
    planLabel: {
      ...typography.footnoteMedium,
      color: colors.primary,
    },
  }));
}
