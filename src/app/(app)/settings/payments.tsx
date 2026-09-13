import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { InvoicesList } from '@/components/invoices';
import { Card } from '@/components/ui/card';
import { FilterChipBar } from '@/components/ui/filter-chip';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { useDashboard } from '@/hooks/use-dashboard';
import { useInfiniteInvoices } from '@/hooks/use-invoices';
import { formatCurrency } from '@/lib/format/currency';

type PeriodId = 'month' | 'quarter' | 'year';

const PERIODS: { value: PeriodId; label: string }[] = [
  { value: 'month', label: 'Ce mois' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year', label: 'Année' },
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
        <PaymentStat label="Encaissé ce mois" value={formatCurrency(stats.monthlyRevenue)} />
        <PaymentStat label="En attente" value={formatCurrency(stats.outstandingAmount)} />
        <PaymentStat danger label="En retard" value={String(stats.lateInvoices)} />
      </View>

      <FilterChipBar onChange={setPeriod} options={PERIODS} value={period} />

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

/** Indicateur financier de l'en-tête. Même surface que les cartes de l'app. */
function PaymentStat({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  const styles = useStyles();

  return (
    <Card style={styles.stat} variant="surface">
      <Text maxFontSizeMultiplier={1.4} numberOfLines={2} style={styles.statLabel}>
        {label}
      </Text>
      <Text
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1.3}
        numberOfLines={1}
        style={[styles.statValue, danger && styles.statDangerValue]}>
        {value}
      </Text>
    </Card>
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
      gap: spacing[0.5],
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
  }));
}
