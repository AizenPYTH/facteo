import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { spacing } from '@/constants/theme/spacing';
import { formatCurrency } from '@/lib/format/currency';
import type { DashboardStats } from '@/types/dashboard';

import { StatCard } from './stat-card';

type StatsGridProps = {
  stats: DashboardStats;
};

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <View style={styles.grid}>
      <StatCard
        accentColor={colors.primary}
        label="Monthly revenue"
        style={styles.card}
        value={formatCurrency(stats.monthlyRevenue)}
      />
      <StatCard
        accentColor={colors.warning}
        label="Unpaid invoices"
        style={styles.card}
        value={String(stats.unpaidInvoices)}
      />
      <StatCard
        accentColor={colors.success}
        label="Paid invoices"
        style={styles.card}
        value={String(stats.paidInvoices)}
      />
      <StatCard
        accentColor={colors.iconSecondary}
        label="Total clients"
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
