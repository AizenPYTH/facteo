import { router, type Href } from 'expo-router';
import { Text, View } from 'react-native';

import { ListRow } from '@/components/ui/list-row';
import { StatusChip } from '@/components/ui/status-chip';
import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatCurrency } from '@/lib/format/currency';
import type { DashboardStats, Invoice } from '@/types/dashboard';

type TodoNowSectionProps = {
  stats: DashboardStats;
  recentInvoices: Invoice[];
};

/**
 * À faire maintenant — DESIGN §5.2 : deux lignes actionnables au maximum.
 */
export function TodoNowSection({ stats, recentInvoices }: TodoNowSectionProps) {
  const styles = useStyles();
  const overdueInvoice = recentInvoices.find((invoice) => invoice.status === 'overdue');
  const rows: {
    key: string;
    title: string;
    meta: string;
    value?: string;
    overdue?: boolean;
    href: Href;
  }[] = [];

  if (stats.lateInvoices > 0) {
    rows.push({
      key: 'overdue',
      title:
        stats.lateInvoices === 1
          ? overdueInvoice
            ? `Relancer ${overdueInvoice.number}`
            : 'Relancer une facture en retard'
          : `Relancer ${stats.lateInvoices} factures en retard`,
      meta: 'Action prioritaire',
      value: overdueInvoice ? formatCurrency(overdueInvoice.amount) : undefined,
      overdue: true,
      href: '/invoices' as Href,
    });
  }

  if (stats.pendingQuotes > 0 && rows.length < 2) {
    rows.push({
      key: 'quotes',
      title:
        stats.pendingQuotes === 1
          ? 'Suivre un devis envoyé'
          : `Suivre ${stats.pendingQuotes} devis envoyés`,
      meta: 'En attente de réponse',
      href: '/quotes' as Href,
    });
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text maxFontSizeMultiplier={1.4} style={styles.title}>
        À faire maintenant
      </Text>
      <View style={styles.card}>
        {rows.map((row, index) => (
          <View key={row.key}>
            <ListRow
              meta={row.meta}
              onPress={() => router.push(row.href)}
              overdue={row.overdue}
              showChevron
              title={row.title}
              trailing={
                row.overdue ? <StatusChip label="En retard" tone="overdue" /> : undefined
              }
              value={row.value}
            />
            {index < rows.length - 1 ? <View style={styles.separator} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      gap: spacing.group,
    },
    title: {
      ...typography.headline,
      color: colors.text,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden' as const,
    },
    separator: {
      height: 1,
      backgroundColor: colors.separator,
      marginLeft: spacing.listItemPadding,
    },
  }));
}
