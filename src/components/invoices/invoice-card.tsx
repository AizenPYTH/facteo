import { Pressable, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { QuoteField } from '@/components/quotes/quote-field';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';
import { formatDate } from '@/lib/format/date';
import { formatPriceHT } from '@/lib/format/currency';
import { springs } from '@/lib/motion/springs';
import type { Invoice } from '@/types/invoice';

import { InvoiceStatusBadge } from './invoice-status-badge';

export type InvoiceCardProps = {
  invoice: Invoice;
  onPress?: (invoice: Invoice) => void;
  style?: ViewStyle;
  testID?: string;
};

export function InvoiceCard({ invoice, onPress, style, testID }: InvoiceCardProps) {
  const styles = useStyles();
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const displayDate = formatDate(invoice.issuedAt ?? invoice.createdAt);

  const content = (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <QuoteField emphasize label="Numéro" value={invoice.number} />
        <InvoiceStatusBadge status={invoice.status} />
      </View>

      <View style={styles.row}>
        <QuoteField label="Client" value={invoice.clientName} />
        <QuoteField label="Date" value={displayDate} />
      </View>

      <View style={styles.row}>
        <QuoteField label="Montant TTC" value={formatPriceHT(invoice.totalTtc)} />
        {invoice.dueAt ? <QuoteField label="Échéance" value={formatDate(invoice.dueAt)} /> : null}
      </View>
    </View>
  );

  if (!onPress) {
    return <View testID={testID}>{content}</View>;
  }

  return (
    <Animated.View style={pressStyle}>
      <Pressable
        accessibilityLabel={`Facture ${invoice.number}`}
        accessibilityRole="button"
        onPress={() => onPress(invoice)}
        onPressIn={() => {
          // eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue mutation is safe here.
          scale.value = withSpring(0.98, springs.snappy);
        }}
        onPressOut={() => {
          // eslint-disable-next-line react-hooks/immutability
          scale.value = withSpring(1, springs.snappy);
        }}
        testID={testID}>
        {content}
      </Pressable>
    </Animated.View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
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
