import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import {
  formatPriceHt,
  getInheritLabel,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PRICING_COPY,
  type CatalogPlan,
  type CatalogPlanId,
  type PaidCatalogPlanId,
} from '@/constants/subscription-plans';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import type { EffectivePlanId } from '@/types/subscription';

type PlanCatalogProps = {
  currentPlanId?: EffectivePlanId | string | null;
  checkoutLoadingPlanId?: PaidCatalogPlanId | null;
  onSelectPaidPlan: (planId: PaidCatalogPlanId) => void;
  onManageSubscription?: () => void;
  manageLoading?: boolean;
  checkoutEnabled?: boolean;
};

export function PlanCatalog({
  currentPlanId,
  checkoutLoadingPlanId = null,
  onSelectPaidPlan,
  onManageSubscription,
  manageLoading = false,
  checkoutEnabled = true,
}: PlanCatalogProps) {
  const styles = useStyles();
  const effective = (currentPlanId ?? 'micro') as EffectivePlanId | string;
  const isPaidSubscriber = effective !== 'micro';

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{SUBSCRIPTION_PRICING_COPY.title}</Text>
      <Text style={styles.sectionSubtitle}>{SUBSCRIPTION_PRICING_COPY.subtitle}</Text>

      {SUBSCRIPTION_PLANS.map((plan) => (
        <PlanCard
          key={plan.id}
          checkoutEnabled={checkoutEnabled}
          checkoutLoading={checkoutLoadingPlanId === plan.id}
          isCurrent={isCurrentCatalogPlan(plan.id, effective)}
          isPaidSubscriber={isPaidSubscriber}
          manageLoading={manageLoading}
          onManage={onManageSubscription}
          onSelectPaidPlan={onSelectPaidPlan}
          plan={plan}
        />
      ))}

      <Text style={styles.vatNote}>{SUBSCRIPTION_PRICING_COPY.vatNote}</Text>
    </View>
  );
}

type PlanCardProps = {
  plan: CatalogPlan;
  isCurrent: boolean;
  isPaidSubscriber: boolean;
  checkoutLoading: boolean;
  checkoutEnabled: boolean;
  manageLoading: boolean;
  onSelectPaidPlan: (planId: PaidCatalogPlanId) => void;
  onManage?: () => void;
};

function PlanCard({
  plan,
  isCurrent,
  isPaidSubscriber,
  checkoutLoading,
  checkoutEnabled,
  manageLoading,
  onSelectPaidPlan,
  onManage,
}: PlanCardProps) {
  const styles = useStyles();
  const inheritLabel = getInheritLabel(plan);
  const isPaid = plan.id !== 'micro';

  return (
    <View style={[styles.card, plan.highlighted && styles.cardHighlighted, isCurrent && styles.cardCurrent]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.planName}>{plan.name}</Text>
          {plan.badge ? <Text style={styles.badge}>{plan.badge}</Text> : null}
          {isCurrent ? <Text style={styles.currentBadge}>{SUBSCRIPTION_PRICING_COPY.currentBadge}</Text> : null}
        </View>
        <Text style={styles.price}>
          {formatPriceHt(plan.priceMonthlyHt)}
          <Text style={styles.pricePeriod}>{SUBSCRIPTION_PRICING_COPY.perMonthLabel}</Text>
        </Text>
        <Text style={styles.description}>{plan.description}</Text>
      </View>

      {inheritLabel ? <Text style={styles.inherit}>{inheritLabel}</Text> : null}

      <View style={styles.features}>
        {plan.features.map((feature) => (
          <Text key={feature.id} style={styles.feature}>
            · {feature.label}
          </Text>
        ))}
      </View>

      {isCurrent && isPaidSubscriber && onManage ? (
        <Button
          loading={manageLoading}
          onPress={onManage}
          title={SUBSCRIPTION_PRICING_COPY.manageCta}
          variant="ghost"
        />
      ) : null}

      {!isCurrent && isPaid && !isPaidSubscriber ? (
        <Button
          disabled={!checkoutEnabled}
          loading={checkoutLoading}
          onPress={() => onSelectPaidPlan(plan.id as PaidCatalogPlanId)}
          title={plan.cta}
        />
      ) : null}

      {!isCurrent && isPaid && isPaidSubscriber && onManage ? (
        <Button
          loading={manageLoading}
          onPress={onManage}
          title="Changer d’offre"
          variant="ghost"
        />
      ) : null}

      {!isCurrent && !isPaid ? (
        <Text style={styles.freeHint}>Inclus dès l’inscription</Text>
      ) : null}
    </View>
  );
}

function isCurrentCatalogPlan(planId: CatalogPlanId, effective: EffectivePlanId | string): boolean {
  if (effective === 'max') {
    return planId === 'pro';
  }

  return planId === effective;
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      gap: spacing.md,
    },
    sectionTitle: {
      ...typography.title2,
      color: colors.text,
    },
    sectionSubtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    card: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    cardHighlighted: {
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    cardCurrent: {
      backgroundColor: colors.backgroundGrouped,
    },
    cardHeader: {
      gap: spacing.xs,
    },
    cardTitleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.xs,
    },
    planName: {
      ...typography.headline,
      color: colors.text,
    },
    badge: {
      ...typography.caption2,
      color: colors.onPrimary,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    currentBadge: {
      ...typography.caption2,
      color: colors.primary,
      backgroundColor: colors.primarySubtle,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    price: {
      ...typography.title2,
      color: colors.text,
    },
    pricePeriod: {
      ...typography.footnote,
      color: colors.textSecondary,
      fontWeight: '400',
    },
    description: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    inherit: {
      ...typography.footnoteMedium,
      color: colors.primary,
    },
    features: {
      gap: 4,
    },
    feature: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    freeHint: {
      ...typography.footnote,
      color: colors.textTertiary,
    },
    vatNote: {
      ...typography.caption1,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
  }));
}
