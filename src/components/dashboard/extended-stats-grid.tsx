import { StyleSheet, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { formatCurrency } from '@/lib/format/currency';
import type { DashboardStats } from '@/types/dashboard';

import { SectionHeader } from './section-header';
import { StatCard } from './stat-card';

type ExtendedStatsGridProps = {
  stats: DashboardStats;
  premiumLocked?: boolean;
};

export function ExtendedStatsGrid({ stats, premiumLocked = false }: ExtendedStatsGridProps) {
  const colors = useColors();

  return (
    <View style={styles.section}>
      <SectionHeader premiumLocked={premiumLocked} title="Vue d’ensemble" />
      <View style={styles.grid}>
        <StatCard
          accentColor={premiumLocked ? undefined : colors.text}
          label="Aujourd’hui"
          premiumLocked={premiumLocked}
          style={styles.card}
          value={formatCurrency(stats.todayRevenue)}
        />
        <StatCard
          accentColor={premiumLocked ? undefined : colors.text}
          label="Cette semaine"
          premiumLocked={premiumLocked}
          style={styles.card}
          value={formatCurrency(stats.weeklyRevenue)}
        />
        <StatCard
          accentColor={premiumLocked ? undefined : colors.text}
          label="Ce mois"
          premiumLocked={premiumLocked}
          style={styles.card}
          value={formatCurrency(stats.monthlyRevenue)}
        />
        <StatCard
          accentColor={premiumLocked ? undefined : colors.text}
          label="Cette année"
          premiumLocked={premiumLocked}
          style={styles.card}
          value={formatCurrency(stats.yearlyRevenue)}
        />
        <StatCard
          accentColor={premiumLocked ? undefined : colors.warning}
          label="Encours"
          premiumLocked={premiumLocked}
          style={styles.card}
          value={formatCurrency(stats.outstandingAmount)}
        />
        <StatCard
          accentColor={premiumLocked ? undefined : colors.error}
          label="En retard"
          premiumLocked={premiumLocked}
          style={styles.card}
          value={String(stats.lateInvoices)}
        />
        <StatCard
          label="Délai moyen"
          premiumLocked={premiumLocked}
          style={styles.card}
          value={`${stats.averagePaymentDelayDays} j`}
        />
        <StatCard
          label="Facture moyenne"
          premiumLocked={premiumLocked}
          style={styles.card}
          value={formatCurrency(stats.averageInvoiceAmount)}
        />
        <StatCard
          accentColor={premiumLocked ? undefined : colors.warning}
          label="Devis envoyés"
          premiumLocked={premiumLocked}
          style={styles.wideCard}
          value={String(stats.pendingQuotes)}
        />
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
