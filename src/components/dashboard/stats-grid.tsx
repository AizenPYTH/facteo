import { router, type Href } from 'expo-router';
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
        label="Encaissé ce mois"
        style={styles.cardWide}
        value={formatCurrency(stats.monthlyRevenue)}
      />
      <StatCard
        accentColor={colors.warning}
        label="En attente"
        onPress={() => router.push('/invoices' as Href)}
        style={styles.card}
        value={formatCurrency(stats.outstandingAmount)}
      />
      <StatCard
        accentColor={colors.error}
        label="En retard"
        onPress={() => router.push('/invoices' as Href)}
        style={styles.card}
        value={String(stats.lateInvoices)}
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
  cardWide: {
    flexGrow: 1,
    flexBasis: '100%',
  },
  card: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: '46%',
  },
});
