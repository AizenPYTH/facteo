import { Pressable, View, type ViewStyle } from 'react-native';

import { QuoteField } from '@/components/quotes/quote-field';
import { useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { spacing } from '@/constants/theme/spacing';
import { formatDate } from '@/lib/format/date';
import { formatPriceHT, formatSpokenEuros } from '@/lib/format/currency';
import type { Invoice } from '@/types/invoice';

import { InvoiceStatusBadge } from './invoice-status-badge';

export type InvoiceCardProps = {
  invoice: Invoice;
  onPress?: (invoice: Invoice) => void;
  selected?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function InvoiceCard({
  invoice,
  onPress,
  selected = false,
  style,
  testID,
}: InvoiceCardProps) {
  const styles = useStyles();
  const displayDate = formatDate(invoice.issuedAt ?? invoice.createdAt);

  const content = (
    <View style={[styles.card, invoice.status === 'overdue' && styles.overdue, style]}>
      <View style={styles.header}>
        <QuoteField emphasize label="Numéro" value={invoice.number} />
        <InvoiceStatusBadge status={invoice.status} />
      </View>

      <View style={styles.row}>
        <QuoteField label="Client" value={invoice.clientName} />
        <QuoteField label="Date" value={displayDate} />
      </View>

      <View style={styles.row}>
        <QuoteField
          label="Montant TTC"
          value={formatPriceHT(invoice.totalTtc)}
          valueAccessibilityLabel={formatSpokenEuros(invoice.totalTtc)}
        />
        {invoice.dueAt ? <QuoteField label="Échéance" value={formatDate(invoice.dueAt)} /> : null}
      </View>
    </View>
  );

  if (!onPress) {
    return (
      <View style={[styles.wrapper, selected && styles.selected]} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={`Facture ${invoice.number}, ${formatSpokenEuros(invoice.totalTtc)}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onPress(invoice)}
      style={({ pressed }) => [
        styles.wrapper,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
      testID={testID}>
      {content}
    </Pressable>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  wrapper: {
    backgroundColor: colors.surface,
  },
  selected: {
    backgroundColor: colors.primarySubtle,
  },
  pressed: {
    backgroundColor: colors.backgroundSecondary,
  },
  card: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  overdue: {
    borderLeftWidth: components.overdueAccentWidth,
    borderLeftColor: colors.statusOverdue,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
}));
}
