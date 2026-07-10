import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { spacing } from '@/constants/theme/spacing';
import { formatDate } from '@/lib/format/date';
import { formatPriceHT } from '@/lib/format/currency';
import type { Quote } from '@/types/quote';

import { QuoteField } from './quote-field';
import { QuoteStatusBadge } from './quote-status-badge';

export type QuoteCardProps = {
  quote: Quote;
  style?: ViewStyle;
  testID?: string;
};

export function QuoteCard({ quote, style, testID }: QuoteCardProps) {
  const displayDate = formatDate(quote.issuedAt ?? quote.createdAt);

  return (
    <View style={[styles.wrapper, style]} testID={testID}>
      <View style={styles.card}>
        <View style={styles.header}>
          <QuoteField emphasize label="Numéro" value={quote.number} />
          <QuoteStatusBadge status={quote.status} />
        </View>

        <View style={styles.row}>
          <QuoteField label="Client" value={quote.clientName} />
          <QuoteField label="Date" value={displayDate} />
        </View>

        <View style={styles.row}>
          <QuoteField label="Montant TTC" value={formatPriceHT(quote.totalTtc)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
  },
  card: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
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
});
