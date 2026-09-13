import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import type { DocumentTotals } from '@/lib/calculations/totals';
import { formatPriceHT } from '@/lib/format/currency';

type QuoteTotalsProps = {
  totals: DocumentTotals;
};

/**
 * Totaux du document. La remise cumulée est désormais affichée dès qu'elle est
 * non nulle : elle était calculée et enregistrée, mais invisible.
 */
export function QuoteTotals({ totals }: QuoteTotalsProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Card variant="subtle">
      <Row label="Total HT" value={formatPriceHT(totals.subtotalHt)} />
      {totals.totalDiscount > 0 ? (
        <Row
          label="Remises"
          tone={colors.success}
          value={`− ${formatPriceHT(totals.totalDiscount)}`}
        />
      ) : null}
      <Row label="TVA" value={formatPriceHT(totals.totalVat)} />

      <View style={styles.totalRow}>
        <Text maxFontSizeMultiplier={1.4} style={styles.totalLabel}>
          Total TTC
        </Text>
        <Text
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.4}
          numberOfLines={1}
          style={styles.totalValue}>
          {formatPriceHT(totals.totalTtc)}
        </Text>
      </View>
    </Card>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Text maxFontSizeMultiplier={1.4} style={styles.label}>
        {label}
      </Text>
      <Text maxFontSizeMultiplier={1.4} style={[styles.value, tone ? { color: tone } : null]}>
        {value}
      </Text>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      marginTop: spacing.xs,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separatorOpaque,
    },
    totalLabel: {
      ...typography.headline,
      color: colors.text,
    },
    totalValue: {
      ...typography.headline,
      color: colors.primary,
      flexShrink: 1,
    },
  }));
}
