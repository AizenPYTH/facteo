import { StyleSheet, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { formatCurrency } from '@/lib/format/currency';
import type { DashboardStats } from '@/types/dashboard';

import { StatCard } from './stat-card';

type StatsGridProps = {
  stats: DashboardStats;
};

export function StatsGrid({ stats }: StatsGridProps) {
  const colors = useColors();

  return (
    <View style={styles.grid}>
      <StatCard
        accentColor={colors.primary}
        label="Chiffre d'affaires"
        style={styles.card}
        value={formatCurrency(stats.monthlyRevenue)}
      />
      <StatCard
        accentColor={colors.warning}
        label="Factures impayées"
        style={styles.card}
        value={String(stats.unpaidInvoices)}
      />
      <StatCard
        accentColor={colors.success}
        label="Factures payées"
        style={styles.card}
        value={String(stats.paidInvoices)}
      />
      <StatCard
        accentColor={colors.iconSecondary}
        label="Clients"
        style={styles.card}
        value={String(stats.totalClients)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
});
