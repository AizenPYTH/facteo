import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useColors } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { formatCurrency } from '@/lib/format/currency';
import { fadeInUp } from '@/lib/motion/presets';
import type { DashboardStats } from '@/types/dashboard';

import { StatCard } from './stat-card';

type StatsGridProps = {
  stats: DashboardStats;
};

export function StatsGrid({ stats }: StatsGridProps) {
  const colors = useColors();

  return (
    <View style={styles.grid}>
      <Animated.View entering={fadeInUp({ index: 0 })} style={styles.card}>
        <StatCard
          accentColor={colors.primary}
          formatValue={formatCurrency}
          label="Chiffre d'affaires"
          numericValue={stats.monthlyRevenue}
          value={formatCurrency(stats.monthlyRevenue)}
        />
      </Animated.View>
      <Animated.View entering={fadeInUp({ index: 1 })} style={styles.card}>
        <StatCard
          accentColor={colors.warning}
          label="Factures impayées"
          numericValue={stats.unpaidInvoices}
          value={String(stats.unpaidInvoices)}
        />
      </Animated.View>
      <Animated.View entering={fadeInUp({ index: 2 })} style={styles.card}>
        <StatCard
          accentColor={colors.success}
          label="Factures payées"
          numericValue={stats.paidInvoices}
          value={String(stats.paidInvoices)}
        />
      </Animated.View>
      <Animated.View entering={fadeInUp({ index: 3 })} style={styles.card}>
        <StatCard
          accentColor={colors.iconSecondary}
          label="Clients"
          numericValue={stats.totalClients}
          value={String(stats.totalClients)}
        />
      </Animated.View>
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
