import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/constants/theme/spacing';
import { useColors } from '@/hooks/use-colors';
import { formatCurrency } from '@/lib/format/currency';
import type { DashboardStats } from '@/types/dashboard';

import { StatCard } from './stat-card';

type StatsGridProps = {
  stats: DashboardStats;
};

/**
 * Indicateurs de second rang, sous la carte de tête.
 *
 * L'encaissé du mois n'apparaît plus ici : il est porté par `DashboardHero`.
 * Ne restent que les deux chiffres qui appellent une action.
 */
export function StatsGrid({ stats }: StatsGridProps) {
  const colors = useColors();

  return (
    <View style={styles.grid}>
      <StatCard
        accentColor={colors.warning}
        amount={stats.outstandingAmount}
        format={formatCurrency}
        label="En attente"
        onPress={() => router.push('/invoices' as Href)}
        style={styles.card}
        value={formatCurrency(stats.outstandingAmount)}
      />
      <StatCard
        accentColor={colors.error}
        amount={stats.lateInvoices}
        format={(v) => String(Math.round(v))}
        label={stats.lateInvoices > 1 ? 'Factures en retard' : 'Facture en retard'}
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
    gap: spacing.md,
  },
  card: {
    flex: 1,
    minWidth: 0,
  },
});
