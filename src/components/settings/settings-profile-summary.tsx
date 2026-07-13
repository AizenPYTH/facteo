import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type SettingsProfileSummaryProps = {
  companyName?: string | null;
  email?: string | null;
  planLabel: string;
  onPressPlan?: () => void;
};

export function SettingsProfileSummary({
  companyName,
  email,
  planLabel,
  onPressPlan,
}: SettingsProfileSummaryProps) {
  const styles = useStyles();
  const displayName = companyName?.trim() || 'Entreprise';

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
          style={({ pressed }) => [styles.planBadge, pressed && styles.planBadgePressed]}>
          <Text style={styles.planLabel}>{planLabel}</Text>
        </Pressable>
      ) : (
        <View style={styles.planBadge}>
          <Text style={styles.planLabel}>{planLabel}</Text>
        </View>
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    companyName: {
      ...typography.title3,
      color: colors.text,
    },
    email: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    planBadge: {
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.chip,
      backgroundColor: colors.backgroundGrouped,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    planBadgePressed: {
      opacity: 0.88,
    },
    planLabel: {
      ...typography.footnoteMedium,
      color: colors.primary,
    },
  }));
}
