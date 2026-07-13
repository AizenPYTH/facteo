import { StyleSheet, Text, View } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatPriceHT } from '@/lib/format/currency';
import type { DocumentTotals } from '@/lib/calculations/totals';

type QuoteTotalsProps = {
  totals: DocumentTotals;
};

export function QuoteTotals({ totals }: QuoteTotalsProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Total HT</Text>
        <Text style={styles.value}>{formatPriceHT(totals.subtotalHt)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>TVA</Text>
        <Text style={styles.value}>{formatPriceHT(totals.totalVat)}</Text>
      </View>
      <View style={[styles.row, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total TTC</Text>
        <Text style={styles.totalValue}>{formatPriceHT(totals.totalTtc)}</Text>
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
