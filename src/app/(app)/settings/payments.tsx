import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InvoicesList } from '@/components/invoices';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { useDashboard } from '@/hooks/use-dashboard';
import { useInfiniteInvoices } from '@/hooks/use-invoices';
import { useThemedStyles } from '@/hooks/use-colors';
import { formatCurrency } from '@/lib/format/currency';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type PeriodId = 'month' | 'quarter' | 'year';

const PERIODS: { id: PeriodId; label: string }[] = [
  { id: 'month', label: 'Ce mois' },
  { id: 'quarter', label: 'Trimestre' },
  { id: 'year', label: 'Année' },
];

function periodStart(period: PeriodId): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (period === 'month') {
    start.setDate(1);
  } else if (period === 'quarter') {
    start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
  } else {
    start.setMonth(0, 1);
  }
  return start;
}

export default function PaymentsSettingsScreen() {
  const styles = useStyles();
  const [period, setPeriod] = useState<PeriodId>('month');
  const { stats } = useDashboard();
  const { invoices, isLoading, isRefetching, refetch } = useInfiniteInvoices('', 'paid');

  const visible = useMemo(() => {
    const start = periodStart(period).getTime();
    return invoices.filter((invoice) => {
      const reference = invoice.paidAt ?? invoice.issuedAt;
      if (!reference) {
        return false;
      }
      const time = new Date(reference).getTime();
      return Number.isFinite(time) && time >= start;
    });
  }, [invoices, period]);

  return (
    <SettingsScreenFrame scrollable={false} title="Paiements">
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Encaissé ce mois</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.monthlyRevenue)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>En attente</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.outstandingAmount)}</Text>
        </View>
        <View style={[styles.stat, styles.statDanger]}>
          <Text style={styles.statLabel}>En retard</Text>
          <Text style={[styles.statValue, styles.statDangerValue]}>{String(stats.lateInvoices)}</Text>
        </View>
      </View>

      <View style={styles.chips}>
        {PERIODS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setPeriod(item.id)}
            style={[styles.chip, period === item.id && styles.chipActive]}>
            <Text style={[styles.chipLabel, period === item.id && styles.chipLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <InvoicesList
        invoices={visible}
        isInitialLoading={isLoading && invoices.length === 0}
        isRefreshing={isRefetching}
        isSearching={false}
        onInvoicePress={(invoice) => router.push(`/invoices/${invoice.id}` as Href)}
        onRefresh={() => {
          void refetch();
        }}
        showCreateAction={false}
      />
    </SettingsScreenFrame>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    stats: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    stat: {
      flexGrow: 1,
      flexBasis: '30%',
      minWidth: 96,
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.md,
      gap: 4,
    },
    statDanger: {
      borderColor: colors.error,
    },
    statLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    statValue: {
      ...typography.headline,
      color: colors.text,
    },
    statDangerValue: {
      color: colors.error,
    },
    chips: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    chip: {
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipActive: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primary,
    },
    chipLabel: {
      ...typography.subheadlineMedium,
      color: colors.textSecondary,
    },
    chipLabelActive: {
      color: colors.primary,
    },
  }));
}
