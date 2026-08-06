import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useColors, useGradients, useThemedStyles } from '@/hooks/use-colors';
import { formatPlanLimit } from '@/lib/subscription/plans';
import { fadeInUp } from '@/lib/motion/presets';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import type { SubscriptionPlan } from '@/types/subscription';

type PlanComparisonProps = {
  standardPlan: SubscriptionPlan;
  premiumPlan: SubscriptionPlan;
  currentPlanId?: 'free' | 'premium';
};

type ComparisonRow = {
  label: string;
  standard: string;
  premium: string;
  premiumHighlight?: boolean;
};

const PREMIUM_ONLY_FEATURES = [
  'Recherche SIREN / SIRET',
  'Logo personnalisé',
  'Signature entreprise',
  'Signature client',
  'Paiement Stripe',
  'Statistiques avancées',
  'Futures fonctionnalités Premium',
] as const;

export function PlanComparison({ standardPlan, premiumPlan, currentPlanId }: PlanComparisonProps) {
  const styles = useStyles();
  const colors = useColors();
  const gradients = useGradients();

  const limitRows: ComparisonRow[] = [
    {
      label: 'Clients',
      standard: formatPlanLimit(standardPlan.maxClients),
      premium: formatPlanLimit(premiumPlan.maxClients),
      premiumHighlight: true,
    },
    {
      label: 'Devis',
      standard: formatPlanLimit(standardPlan.maxQuotes),
      premium: formatPlanLimit(premiumPlan.maxQuotes),
      premiumHighlight: true,
    },
    {
      label: 'Factures',
      standard: formatPlanLimit(standardPlan.maxInvoices),
      premium: formatPlanLimit(premiumPlan.maxInvoices),
      premiumHighlight: true,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Comparer les offres</Text>

      <View style={[styles.planCard, currentPlanId === 'free' ? styles.planCardCurrent : null]}>
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>INVEQ Standard</Text>
          {currentPlanId === 'free' ? <PlanBadge label="Actuel" /> : null}
        </View>
        <Text style={styles.planSubtitle}>Gratuit · l’essentiel pour démarrer</Text>
      </View>

      <LinearGradient
        colors={gradients.primarySubtle}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={[
          styles.planCard,
          styles.planCardPremium,
          currentPlanId === 'premium' ? styles.planCardCurrent : null,
        ]}>
        <View style={styles.planHeader}>
          <Text style={[styles.planTitle, styles.planTitlePremium]}>INVEQ Premium</Text>
          {currentPlanId === 'premium' ? (
            <PlanBadge label="Actuel" premium />
          ) : (
            <SymbolView name="star.fill" size={14} tintColor={colors.primary} />
          )}
        </View>
        <Text style={styles.planSubtitle}>Fonctionnalités avancées de votre compte INVEQ</Text>
      </LinearGradient>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.tableFeatureCol]}> </Text>
          <Text style={styles.tableHeaderCell}>Standard</Text>
          <Text style={[styles.tableHeaderCell, styles.tablePremiumCol]}>Premium</Text>
        </View>

        {limitRows.map((row, index) => (
          <Animated.View entering={fadeInUp({ index, step: 30 })} key={row.label}>
            <ComparisonTableRow row={row} />
          </Animated.View>
        ))}

        {PREMIUM_ONLY_FEATURES.map((feature, index) => (
          <Animated.View
            entering={fadeInUp({ index: limitRows.length + index, step: 30 })}
            key={feature}
            style={styles.tableRow}>
            <Text style={[styles.featureLabel, styles.tableFeatureCol]}>{feature}</Text>
            <View style={styles.iconCell}>
              <SymbolView name="lock.fill" size={15} tintColor={colors.textTertiary} />
            </View>
            <View style={styles.iconCell}>
              <SymbolView name="checkmark" size={15} tintColor={colors.primary} weight="semibold" />
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

function ComparisonTableRow({ row }: { row: ComparisonRow }) {
  const styles = useStyles();

  return (
    <View style={styles.tableRow}>
      <Text style={[styles.featureLabel, styles.tableFeatureCol]}>{row.label}</Text>
      <Text style={styles.standardValue}>{row.standard}</Text>
      <Text
        style={[
          styles.premiumValue,
          styles.tablePremiumCol,
          row.premiumHighlight ? styles.premiumValueHighlight : null,
        ]}>
        {row.premium}
      </Text>
    </View>
  );
}

function PlanBadge({ label, premium = false }: { label: string; premium?: boolean }) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View style={[styles.badge, premium ? styles.badgePremium : null]}>
      <Text style={[styles.badgeText, premium ? { color: colors.primary } : null]}>{label}</Text>
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
    planCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: spacing.xs,
    },
    planCardPremium: {
      backgroundColor: 'transparent',
      borderColor: colors.primary,
      ...shadows.sm,
    },
    planCardCurrent: {
      borderWidth: 1.5,
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    planTitle: {
      ...typography.headline,
      color: colors.text,
    },
    planTitlePremium: {
      color: colors.primary,
    },
    planSubtitle: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
      backgroundColor: colors.backgroundGrouped,
    },
    badgePremium: {
      backgroundColor: `${colors.primary}18`,
    },
    badgeText: {
      ...typography.caption2,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    table: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.sm,
    },
    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.backgroundGrouped,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    tableHeaderCell: {
      flex: 1,
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: '600',
      textAlign: 'center',
    },
    tableFeatureCol: {
      flex: 1.6,
      textAlign: 'left',
    },
    tablePremiumCol: {
      color: colors.primary,
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    featureLabel: {
      ...typography.subheadline,
      color: colors.text,
    },
    standardValue: {
      flex: 1,
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    premiumValue: {
      flex: 1,
      ...typography.subheadline,
      color: colors.text,
      textAlign: 'center',
    },
    premiumValueHighlight: {
      color: colors.primary,
      fontWeight: '600',
    },
    iconCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }));
}
