import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { PlanComparison } from '@/components/subscription/plan-comparison';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { LoadingView } from '@/components/ui/loading-view';
import { iconSize } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { fadeInUp } from '@/lib/motion/presets';
import { getEffectivePlanDisplayName } from '@/lib/subscription/plans';
import { useSubscription, useSubscriptionPlans } from '@/hooks/use-subscription';

export default function PremiumScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { subscription, isPremium, usage, isLoading } = useSubscription();
  const plansQuery = useSubscriptionPlans();

  const standardPlan = plansQuery.data?.find((plan) => plan.id === 'free' || plan.id === 'micro');
  const premiumPlan =
    plansQuery.data?.find((plan) => plan.id === subscription?.effectivePlanId) ??
    plansQuery.data?.find((plan) => plan.id === 'premium' || plan.id === 'pro' || plan.id === 'max');

  const planName = getEffectivePlanDisplayName(subscription?.effectivePlanId ?? 'micro');
  const statusLabel = isPremium ? `Offre active · ${planName}` : `Offre actuelle · ${planName}`;

  if (isLoading || plansQuery.isLoading || !standardPlan || !premiumPlan) {
    return (
      <SettingsScreenFrame title="Abonnement">
        <LoadingView message="Chargement de votre offre..." />
      </SettingsScreenFrame>
    );
  }

  return (
    <SettingsScreenFrame title="Abonnement">
      <View style={styles.content}>
        <Animated.View entering={fadeInUp({ index: 0 })} style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <SymbolView
              name={
                isPremium
                  ? { ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }
                  : { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }
              }
              size={iconSize.lg}
              tintColor={isPremium ? colors.success : colors.primary}
            />
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>Statut de l’abonnement</Text>
              <Text style={styles.statusValue}>{statusLabel}</Text>
            </View>
          </View>
          {subscription?.currentPeriodEnd && isPremium ? (
            <Text style={styles.statusMeta}>
              Période en cours jusqu’au{' '}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
            </Text>
          ) : null}
        </Animated.View>

        {usage ? (
          <Animated.View entering={fadeInUp({ index: 1 })} style={styles.usageRow}>
            <UsageChip label="Clients" value={usage.clients} />
            <UsageChip label="Devis" value={usage.quotes} />
            <UsageChip label="Factures" value={usage.invoices} />
          </Animated.View>
        ) : null}

        <Animated.View entering={fadeInUp({ index: 2 })}>
          <PlanComparison
            currentPlanId={isPremium ? 'premium' : 'free'}
            premiumPlan={premiumPlan}
            standardPlan={standardPlan}
          />
        </Animated.View>

        <Animated.View entering={fadeInUp({ index: 3 })} style={styles.manageCard}>
          <Text style={styles.manageTitle}>Gestion de l’abonnement</Text>
          <Text style={styles.manageMessage}>
            Votre abonnement est géré via votre compte INVEQ.
          </Text>
          <Text style={styles.manageHint}>
            Les fonctionnalités de votre offre sont synchronisées automatiquement dans l’application.
          </Text>
        </Animated.View>
      </View>
    </SettingsScreenFrame>
  );
}

function UsageChip({ label, value }: { label: string; value: number }) {
  const styles = useUsageStyles();

  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    content: {
      gap: spacing.lg,
    },
    statusCard: {
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radius.modal,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    statusText: {
      flex: 1,
      gap: 2,
    },
    statusTitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    statusValue: {
      ...typography.title3,
      color: colors.text,
    },
    statusMeta: {
      ...typography.footnote,
      color: colors.textTertiary,
    },
    usageRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    manageCard: {
      gap: spacing.xs,
      padding: spacing.lg,
      borderRadius: radius.modal,
      backgroundColor: colors.backgroundGrouped,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    manageTitle: {
      ...typography.headline,
      color: colors.text,
    },
    manageMessage: {
      ...typography.body,
      color: colors.text,
      marginTop: spacing.xs,
    },
    manageHint: {
      ...typography.footnote,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  }));
}

function useUsageStyles() {
  return useThemedStyles((colors) => ({
    chip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: 2,
    },
    chipValue: {
      ...typography.headline,
      color: colors.text,
    },
    chipLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
  }));
}
