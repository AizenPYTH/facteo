import { SymbolView } from 'expo-symbols';
import { Platform, StyleSheet, Text, View } from 'react-native';

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
import type { EffectivePlanId } from '@/types/subscription';

type PlanComparisonProps = {
  currentPlanId?: EffectivePlanId | string | null;
  /** Prix StoreKit (iOS). Si fourni, remplace tout prix hardcodé sur la carte Premium. */
  storeKitDisplayPrice?: string | null;
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

/** Sur iOS : uniquement Micro (gratuit) + Premium (IAP). Pas d’autres tarifs web. */
function buildIosPlans(storeKitDisplayPrice?: string | null): DisplayPlan[] {
  const micro = SUBSCRIPTION_CATALOG.find((plan) => plan.id === 'micro');
  const pro = SUBSCRIPTION_CATALOG.find((plan) => plan.id === 'pro');

  return [
    {
      id: 'micro',
      name: 'Micro',
      description: micro?.description ?? 'Pour découvrir INVEQ et facturer vos premiers clients.',
      priceLabel: 'Gratuit',
      pricePeriod: '',
      features: micro?.features ?? [],
      limits: micro?.limits ?? {
        documentsPerMonth: 3,
        sirenSearchesPerMonth: 0,
        companies: 1,
      },
    },
    {
      id: 'premium',
      name: 'Premium',
      description:
        'Débloquez documents illimités, signatures, modèles PDF, multi-entreprises et recherche SIREN.',
      priceLabel: storeKitDisplayPrice?.trim() || 'Prix App Store',
      pricePeriod: '',
      highlighted: true,
      badge: 'App Store',
      features: [
        ...(micro?.features ?? []),
        ...(pro?.features ?? []),
        'Signature électronique',
        'Modèles de factures et devis',
        'Jusqu’à plusieurs entreprises',
      ].filter((feature, index, list) => list.indexOf(feature) === index),
      limits: {
        documentsPerMonth: null,
        sirenSearchesPerMonth: null,
        companies: null,
      },
    },
  ];
}

function buildWebPlans(): DisplayPlan[] {
  return SUBSCRIPTION_CATALOG.map((plan) => {
    const parent = plan.inheritsFrom
      ? SUBSCRIPTION_CATALOG.find((entry) => entry.id === plan.inheritsFrom)
      : null;

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      priceLabel: formatCatalogPriceHt(plan.priceMonthlyHt),
      pricePeriod: ' / mois',
      highlighted: plan.highlighted,
      badge: plan.badge,
      inherit: parent ? `Tout ${parent.name}` : null,
      features: plan.features,
      limits: plan.limits,
    };
  });
}

function isCurrentPlan(currentPlanId: string | null | undefined, planId: string): boolean {
  if (!currentPlanId) {
    return planId === 'micro';
  }

  if (planId === 'premium') {
    return currentPlanId !== 'micro';
  }

  return currentPlanId === planId;
}

export function PlanComparison({ currentPlanId, storeKitDisplayPrice }: PlanComparisonProps) {
  const styles = useStyles();
  const colors = useColors();
  const plans =
    Platform.OS === 'ios' ? buildIosPlans(storeKitDisplayPrice) : buildWebPlans();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Nos offres</Text>
      <Text style={styles.sectionHint}>
        {Platform.OS === 'ios'
          ? 'Sur iPhone et iPad, Premium s’achète dans l’app via l’App Store.'
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
    container: {
      gap: spacing.md,
    },
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
    planCardHighlighted: {
      borderColor: colors.primary,
    },
    planCardCurrent: {
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    planHeader: {
      gap: spacing.xs,
    },
    planTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    planTitle: {
      ...typography.headline,
      color: colors.text,
    },
    planTitleHighlight: {
      color: colors.primary,
    },
    price: {
      ...typography.title3,
      color: colors.text,
    },
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
    limits: {
      gap: 4,
      paddingTop: spacing.xs,
    },
    limitRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    limitLabel: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    limitValue: {
      ...typography.caption1,
      color: colors.text,
      fontWeight: '600',
    },
    features: {
      gap: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    featureText: {
      ...typography.footnote,
      color: colors.text,
      flex: 1,
    },
  }));
}
