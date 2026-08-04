import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useColors } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { formatCurrency } from '@/lib/format/currency';
import { fadeInUp } from '@/lib/motion/presets';
import type { DashboardStats } from '@/types/dashboard';

import { SectionHeader } from './section-header';
import { StatCard } from './stat-card';

type ExtendedStatsGridProps = {
  stats: DashboardStats;
  premiumLocked?: boolean;
};

export function ExtendedStatsGrid({ stats, premiumLocked = false }: ExtendedStatsGridProps) {
  const colors = useColors();

  const cards = [
    {
      accentColor: colors.primary,
      label: 'Aujourd’hui',
      value: formatCurrency(stats.todayRevenue),
      style: styles.card,
    },
    {
      accentColor: colors.info,
      label: 'Cette semaine',
      value: formatCurrency(stats.weeklyRevenue),
      style: styles.card,
    },
    {
      accentColor: colors.success,
      label: 'Ce mois',
      value: formatCurrency(stats.monthlyRevenue),
      style: styles.card,
    },
    {
      accentColor: colors.primary,
      label: 'Cette année',
      value: formatCurrency(stats.yearlyRevenue),
      style: styles.card,
    },
    {
      accentColor: colors.warning,
      label: 'Encours',
      value: formatCurrency(stats.outstandingAmount),
      style: styles.card,
    },
    {
      accentColor: colors.error,
      label: 'En retard',
      value: String(stats.lateInvoices),
      style: styles.card,
    },
    {
      accentColor: colors.iconSecondary,
      label: 'Délai moyen',
      value: `${stats.averagePaymentDelayDays} j`,
      style: styles.card,
    },
    {
      accentColor: colors.iconSecondary,
      label: 'Facture moyenne',
      value: formatCurrency(stats.averageInvoiceAmount),
      style: styles.card,
    },
    {
      accentColor: colors.warning,
      label: 'Devis envoyés',
      value: String(stats.pendingQuotes),
      style: styles.wideCard,
    },
  ] as const;

  return (
    <View style={styles.section}>
      <SectionHeader premiumLocked={premiumLocked} title="Vue d’ensemble" />
      <View style={styles.grid}>
        {cards.map((card, index) => (
          <Animated.View entering={fadeInUp({ index, step: 40 })} key={card.label} style={card.style}>
            <StatCard
              accentColor={card.accentColor}
              label={card.label}
              premiumLocked={premiumLocked}
              value={card.value}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: '46%',
  },
  wideCard: {
    flexGrow: 1,
    flexBasis: '100%',
    minWidth: '100%',
  },
});
