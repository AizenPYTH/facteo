import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

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
};

function inheritLabel(plan: CatalogPlan): string | null {
  if (!plan.inheritsFrom) return null;
  const parent = SUBSCRIPTION_CATALOG.find((entry) => entry.id === plan.inheritsFrom);
  return parent ? `Tout ${parent.name}` : null;
}

export function PlanComparison({ currentPlanId }: PlanComparisonProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Nos offres</Text>
      <Text style={styles.sectionHint}>
        Choisissez l’offre adaptée à votre activité. Sur iPhone et iPad, l’abonnement Premium
        s’achète dans l’app via l’App Store.
      </Text>

      {SUBSCRIPTION_CATALOG.map((plan) => {
        const isCurrent = currentPlanId === plan.id;
        const inherit = inheritLabel(plan);

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
                {formatCatalogPriceHt(plan.priceMonthlyHt)}
                <Text style={styles.pricePeriod}> / mois</Text>
              </Text>
            </View>

            <Text style={styles.description}>{plan.description}</Text>
            {inherit ? <Text style={styles.inherit}>{inherit} +</Text> : null}

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
