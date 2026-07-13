import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatCurrency } from '@/lib/format/currency';
import type { Invoice } from '@/types/dashboard';

export type RecentInvoiceCardProps = {
  invoice: Invoice;
  onPress?: () => void;
  showSeparator?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function RecentInvoiceCard({
  invoice,
  onPress,
  showSeparator = false,
  style,
  testID,
}: RecentInvoiceCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const content = (
    <View style={[styles.row, style]}>
      <View style={styles.leading}>
        <Text style={styles.invoiceNumber}>{invoice.number}</Text>
        <Text style={styles.clientName}>{invoice.clientName}</Text>
      </View>
      <Text style={styles.amount}>{formatCurrency(invoice.amount)}</Text>
    </View>
  );

  return (
    <View testID={testID}>
      {onPress ? (
        <Pressable accessibilityRole="button" onPress={onPress}>
          {content}
        </Pressable>
      ) : (
        content
      )}
      {showSeparator ? <View style={styles.separator} /> : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  leading: {
    flex: 1,
    gap: 2,
  },
  invoiceNumber: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  clientName: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  amount: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: spacing.md,
  },
}));
}
