import { Pressable, View, type ViewStyle } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { spacing } from '@/constants/theme/spacing';
import { formatDate } from '@/lib/format/date';
import { formatPriceHT } from '@/lib/format/currency';
import type { Quote } from '@/types/quote';

import { QuoteField } from './quote-field';
import { QuoteStatusBadge } from './quote-status-badge';

export type QuoteCardProps = {
  quote: Quote;
  onPress?: (quote: Quote) => void;
  selected?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function QuoteCard({
  quote,
  onPress,
  selected = false,
  style,
  testID,
}: QuoteCardProps) {
  const styles = useStyles();
  const displayDate = formatDate(quote.issuedAt ?? quote.createdAt);

  const content = (
    <View style={[styles.card, quote.status === 'expired' && styles.overdue, style]}>
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
      accessibilityLabel={`Devis ${quote.number}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onPress(quote)}
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
