import { SymbolView } from 'expo-symbols';
import { Platform, StyleSheet, Text, View } from 'react-native';

import type { ApplePaidPlanId } from '@/constants/iap';
import {
  SUBSCRIPTION_CATALOG,
  formatCatalogLimit,
  formatCatalogPriceHt,
  type CatalogPlan,
} from '@/constants/subscription-catalog';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { resolveEffectivePlanId } from '@/lib/subscription/plans';
import type { EffectivePlanId } from '@/types/subscription';

type PlanComparisonProps = {
  currentPlanId?: EffectivePlanId | string | null;
  /** Prix StoreKit par plan (iOS). */
  storeKitPrices?: Partial<Record<ApplePaidPlanId, string>> | null;
};

type DisplayPlan = {
  id: string;
  name: string;
  description: string;
  priceLabel: string;
  pricePeriod: string;
  highlighted?: boolean;
  badge?: string;
  inherit?: string | null;
  features: string[];
  limits: CatalogPlan['limits'];
};

function buildPlans(
  storeKitPrices?: Partial<Record<ApplePaidPlanId, string>> | null,
): DisplayPlan[] {
  return SUBSCRIPTION_CATALOG.map((plan) => {
    const parent = plan.inheritsFrom
      ? SUBSCRIPTION_CATALOG.find((entry) => entry.id === plan.inheritsFrom)
      : null;

    const isIosPaid = Platform.OS === 'ios' && plan.id !== 'micro';
    const storePrice =
      isIosPaid && storeKitPrices
        ? storeKitPrices[plan.id as ApplePaidPlanId]
        : undefined;

    // iOS : jamais de prix web HT — StoreKit uniquement (DESIGN §1 / §5.10).
    const priceLabel = storePrice?.trim()
      ? storePrice
      : plan.id === 'micro'
        ? 'Gratuit'
        : Platform.OS === 'ios'
          ? 'Prix App Store'
          : formatCatalogPriceHt(plan.priceMonthlyHt);

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      priceLabel,
      pricePeriod:
        storePrice || plan.id === 'micro' || Platform.OS === 'ios' ? '' : ' / mois',
      highlighted: plan.highlighted,
      badge: Platform.OS === 'ios' && plan.id !== 'micro' ? 'App Store' : plan.badge,
      inherit: parent ? `Tout ${parent.name}` : null,
      features: plan.features,
      limits: plan.limits,
    };
  });
}

function isCurrentPlan(currentPlanId: string | null | undefined, planId: string): boolean {
  const current = resolveEffectivePlanId(currentPlanId ?? 'micro');
  return current === planId;
}

export function PlanComparison({ currentPlanId, storeKitPrices }: PlanComparisonProps) {
  const styles = useStyles();
  const colors = useColors();
  const plans = buildPlans(storeKitPrices);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Nos offres</Text>
      <Text style={styles.sectionHint}>
        {Platform.OS === 'ios'
          ? 'Sur iPhone et iPad, les abonnements payants s’achètent via l’App Store. Le prix affiché est celui d’Apple.'
          : 'Choisissez l’offre adaptée à votre activité.'}
      </Text>

      {plans.map((plan) => {
        const isCurrent = isCurrentPlan(currentPlanId, plan.id);

        return (
          <View
            key={plan.id}
            style={[
              styles.planCard,
              plan.highlighted ? styles.planCardHighlighted : null,
              isCurrent ? styles.planCardCurrent : null,
            ]}>
            <View style={styles.planHeader}>
              <View style={styles.planTitleRow}>
                <Text style={[styles.planTitle, plan.highlighted ? styles.planTitleHighlight : null]}>
                  {plan.name}
                </Text>
                {plan.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{plan.badge}</Text>
                  </View>
                ) : null}
                {isCurrent ? (
                  <View style={styles.badgeCurrent}>
                    <Text style={styles.badgeCurrentText}>Actuel</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.price}>
                {plan.priceLabel}
                {plan.pricePeriod ? (
                  <Text style={styles.pricePeriod}>{plan.pricePeriod}</Text>
                ) : null}
              </Text>
            </View>

            <Text style={styles.description}>{plan.description}</Text>
            {plan.inherit ? <Text style={styles.inherit}>{plan.inherit} +</Text> : null}

            <View style={styles.limits}>
              <LimitRow
                label="Documents / mois"
                value={formatCatalogLimit(plan.limits.documentsPerMonth, '/ mois')}
              />
              <LimitRow
                label="SIREN / SIRET"
                value={formatCatalogLimit(plan.limits.sirenSearchesPerMonth, '/ mois')}
              />
              <LimitRow
                label="Entreprises"
                value={formatCatalogLimit(plan.limits.companies, '')}
              />
            </View>

            <View style={styles.features}>
              {plan.features.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <SymbolView name="checkmark" size={14} tintColor={colors.primary} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function LimitRow({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.limitRow}>
      <Text style={styles.limitLabel}>{label}</Text>
      <Text style={styles.limitValue}>{value}</Text>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: { gap: spacing.md },
    sectionLabel: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    sectionHint: {
      ...typography.footnote,
      color: colors.textTertiary,
      marginTop: -spacing.sm,
    },
    planCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    planCardHighlighted: { borderColor: colors.primary },
    planCardCurrent: { borderWidth: 1.5, borderColor: colors.primary },
    planHeader: { gap: spacing.xs },
    planTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    planTitle: { ...typography.headline, color: colors.text },
    planTitleHighlight: { color: colors.primary },
    price: { ...typography.title3, color: colors.text },
    pricePeriod: {
      ...typography.footnote,
      color: colors.textSecondary,
      fontWeight: '400',
    },
    description: {
      ...typography.footnote,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    inherit: {
      ...typography.caption1,
      color: colors.primary,
      fontWeight: '600',
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
      backgroundColor: `${colors.primary}18`,
    },
    badgeText: {
      ...typography.caption2,
      color: colors.primary,
      fontWeight: '600',
    },
    badgeCurrent: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
      backgroundColor: colors.backgroundGrouped,
    },
    badgeCurrentText: {
      ...typography.caption2,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    limits: { gap: 4, paddingTop: spacing.xs },
    limitRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    limitLabel: { ...typography.caption1, color: colors.textTertiary },
    limitValue: { ...typography.caption1, color: colors.text, fontWeight: '600' },
    features: {
      gap: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    featureText: { ...typography.footnote, color: colors.text, flex: 1 },
  }));
}
