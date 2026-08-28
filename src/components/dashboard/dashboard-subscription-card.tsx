import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { useSubscription } from '@/hooks/use-subscription';
import { formatDate } from '@/lib/format/date';
import { getPlanDisplayName } from '@/lib/subscription/plans';
import type { SubscriptionStatus } from '@/types/subscription';

function statusLabel(status: SubscriptionStatus | undefined, cancelAtPeriodEnd: boolean): string {
  if (cancelAtPeriodEnd) return 'Résiliation';
  switch (status) {
    case 'active':
      return 'Actif';
    case 'trialing':
      return 'Essai';
    case 'past_due':
      return 'En retard';
    case 'canceled':
    case 'unpaid':
      return 'Expiré';
    case 'incomplete':
      return 'Incomplet';
    default:
      return 'Actif';
  }
}

/** Carte abonnement visible sur le tableau de bord (web desktop + mobile). */
export function DashboardSubscriptionCard() {
  const styles = useStyles();
  const { subscription, plan, isPremium, isLoading } = useSubscription();

  if (isLoading) {
    return <View style={styles.skeleton} />;
  }

  const planName =
    plan?.displayName ??
    getPlanDisplayName(subscription?.effectivePlanId ?? subscription?.plan ?? 'micro');
  const badge = statusLabel(subscription?.status, Boolean(subscription?.cancelAtPeriodEnd));
  const renewal =
    subscription?.currentPeriodEnd && isPremium
      ? subscription.cancelAtPeriodEnd
        ? `Se termine le ${formatDate(subscription.currentPeriodEnd)}`
        : `Renouvellement le ${formatDate(subscription.currentPeriodEnd)}`
      : isPremium
        ? 'Offre payante active'
        : 'Offre gratuite — passez à Basique, Standard, Pro ou Max';

  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>Abonnement</Text>
        <View style={styles.titleRow}>
          <Text style={styles.planName}>{planName}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        </View>
        <Text style={styles.meta}>{renewal}</Text>
      </View>
      <Button
        onPress={() => router.push('/settings/premium' as Href)}
        title="Gérer mon abonnement"
        variant={isPremium ? 'ghost' : 'primary'}
      />
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    skeleton: {
      height: 120,
      borderRadius: radius.xl,
      backgroundColor: colors.backgroundSecondary,
      marginBottom: spacing.md,
    },
    card: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: spacing.md,
    },
    copy: {
      gap: spacing.xs,
    },
    eyebrow: {
      ...typography.footnoteMedium,
      color: colors.primary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
    },
    titleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
    },
    planName: {
      ...typography.title3,
      color: colors.text,
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
      backgroundColor: colors.backgroundSecondary,
    },
    badgeText: {
      ...typography.caption1,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    meta: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
  }));
}
