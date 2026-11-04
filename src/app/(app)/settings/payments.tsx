import { useQuery } from '@tanstack/react-query';
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
import { useTenant } from '@/hooks/use-tenant';
import { formatCurrency } from '@/lib/format/currency';
import { supabase } from '@/lib/supabase';
import { invoicesQueryKeys } from '@/lib/supabase/query-keys';

type PeriodId = 'month' | 'quarter' | 'year';

const PERIODS: { value: PeriodId; label: string; collected: string }[] = [
  { value: 'month', label: 'Ce mois', collected: 'Encaissé ce mois' },
  { value: 'quarter', label: 'Trimestre', collected: 'Encaissé ce trimestre' },
  { value: 'year', label: 'Année', collected: 'Encaissé cette année' },
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
  const { scope } = useTenant();
  const { invoices, isLoading, isRefetching, refetch } = useInfiniteInvoices('', 'paid');

  // Total encaissé sur la période choisie, calculé en base : la liste, elle,
  // ne charge que les premières factures.
  const collected = useQuery({
    queryKey: [...invoicesQueryKeys.all, 'collected', scope?.companyId ?? '', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('total, total_ttc')
        .eq('company_id', scope!.companyId)
        .eq('status', 'paid')
        .gte('paid_at', periodStart(period).toISOString());
      if (error) throw error;
      return (data ?? []).reduce((sum, row) => {
        const { total, total_ttc: totalTtc } = row as { total?: unknown; total_ttc?: unknown };
        return sum + (Number(totalTtc ?? total) || 0);
      }, 0);
    },
    enabled: Boolean(scope?.companyId),
    staleTime: 30_000,
  });
  const collectedLabel = PERIODS.find((entry) => entry.value === period)?.collected ?? 'Encaissé';

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
      <FilterChipBar onChange={setPeriod} options={PERIODS} value={period} />

      <View style={styles.stats}>
        <PaymentStat
          label={collectedLabel}
          value={collected.data === undefined ? '—' : formatCurrency(collected.data)}
        />
        <PaymentStat label="En attente" value={formatCurrency(stats.outstandingAmount)} />
        <PaymentStat danger label="En retard" value={String(stats.lateInvoices)} />
      </View>

      <InvoicesList
        invoices={visible}
        isInitialLoading={isLoading && invoices.length === 0}
        isRefreshing={isRefetching}
        isSearching={false}
        onInvoicePress={(invoice) => router.push(`/invoices/${invoice.id}` as Href)}
        onRefresh={() => {
          void refetch();
          void collected.refetch();
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
      marginTop: spacing.sm,
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
