import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useColors } from '@/hooks/use-colors';
import { entrance } from '@/constants/theme/motion';
import { spacing } from '@/constants/theme/spacing';
import { formatCurrency } from '@/lib/format/currency';
import type { DashboardStats } from '@/types/dashboard';

import { StatCard } from './stat-card';

type StatsGridProps = {
  stats: DashboardStats;
  /** When false, skip entrance motion (e.g. already mounted). */
  animate?: boolean;
};

export function StatsGrid({ stats, animate = true }: StatsGridProps) {
  const colors = useColors();

  const cards = [
    {
      key: 'revenue',
      label: "Chiffre d'affaires",
      value: formatCurrency(stats.monthlyRevenue),
      accentColor: colors.text,
    },
    {
      key: 'unpaid',
      label: 'Factures impayées',
      value: String(stats.unpaidInvoices),
      accentColor: stats.unpaidInvoices > 0 ? colors.warning : colors.text,
    },
    {
      key: 'paid',
      label: 'Factures payées',
      value: String(stats.paidInvoices),
      accentColor: colors.success,
    },
    {
      key: 'clients',
      label: 'Clients',
      value: String(stats.totalClients),
      accentColor: colors.text,
    },
  ] as const;

  return (
    <View style={styles.grid}>
      {cards.map((card, index) => {
        const node = (
          <StatCard
            accentColor={card.accentColor}
            label={card.label}
            style={styles.card}
            value={card.value}
          />
        );

        if (!animate) {
          return (
            <View key={card.key} style={styles.cardWrap}>
              {node}
            </View>
          );
        }

        return (
          <Animated.View
            entering={FadeInDown.delay(index * entrance.listStagger)
              .duration(entrance.cardDuration)
              .springify()}
            key={card.key}
            style={styles.cardWrap}>
            {node}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cardWrap: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: '46%',
  },
  card: {
    flex: 1,
  },
});
