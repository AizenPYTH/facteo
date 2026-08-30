import { StyleSheet, Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { useIsLargeContentSize } from '@/hooks/use-is-large-content-size';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatPriceHT, formatSpokenEuros } from '@/lib/format/currency';
import type { DocumentTotals } from '@/lib/calculations/totals';

type QuoteTotalsProps = {
  totals: DocumentTotals;
};

export function QuoteTotals({ totals }: QuoteTotalsProps) {
  const styles = useStyles();
  const isLargeContentSize = useIsLargeContentSize();
  return (
    <View style={styles.container}>
      <View style={[styles.row, isLargeContentSize && styles.rowLarge]}>
        <Text style={styles.label}>Total HT</Text>
        <Text accessibilityLabel={formatSpokenEuros(totals.subtotalHt)} style={styles.value}>
          {formatPriceHT(totals.subtotalHt)}
        </Text>
      </View>
      <View style={[styles.row, isLargeContentSize && styles.rowLarge]}>
        <Text style={styles.label}>TVA</Text>
        <Text accessibilityLabel={formatSpokenEuros(totals.totalVat)} style={styles.value}>
          {formatPriceHT(totals.totalVat)}
        </Text>
      </View>
      <View style={[styles.row, styles.totalRow, isLargeContentSize && styles.rowLarge]}>
        <Text style={styles.totalLabel}>Total TTC</Text>
        <Text
          accessibilityLabel={formatSpokenEuros(totals.totalTtc)}
          style={styles.totalValue}>
          {formatPriceHT(totals.totalTtc)}
        </Text>
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowLarge: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  label: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  value: {
    ...typography.subheadlineMedium,
    color: colors.text,
  },
  totalRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  totalLabel: {
    ...typography.headline,
    color: colors.text,
  },
  totalValue: {
    ...typography.headline,
    color: colors.primary,
  },
}));
}
