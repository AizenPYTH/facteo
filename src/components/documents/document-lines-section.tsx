import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { formatPriceHT, formatVatRate } from '@/lib/format/currency';
import { parseDecimalInput } from '@/lib/format/decimal';
import { mapLineValueToTotals } from '@/lib/quotes/mappers';
import type { QuoteLineValue } from '@/types/quote';

export type DocumentLinesSectionProps = {
  lines: QuoteLineValue[];
};

/**
 * Prestations d'un document en lecture.
 *
 * Le détail facture et le détail devis rendaient le même bloc, dupliqué mot
 * pour mot — y compris le `Number(...replace(',', '.'))` recopié au lieu
 * d'appeler `parseDecimalInput`.
 */
export function DocumentLinesSection({ lines }: DocumentLinesSectionProps) {
  const styles = useStyles();

  return (
    <Card variant="surface">
      {lines.map((line, index) => {
        const totals = mapLineValueToTotals(line);
        const unitPrice = parseDecimalInput(line.unitPrice) || 0;
        const discount = parseDecimalInput(line.discountPercent || '0') || 0;

        return (
          <View key={line.id} style={[styles.line, index > 0 && styles.separated]}>
            <Text maxFontSizeMultiplier={1.4} style={styles.index}>
              Prestation {index + 1}
            </Text>
            <Text maxFontSizeMultiplier={1.5} style={styles.description}>
              {line.description.trim() || 'Sans description'}
            </Text>

            <Text maxFontSizeMultiplier={1.4} style={styles.meta}>
              {`${line.quantity} ${line.unit} × ${formatPriceHT(unitPrice)} HT`}
              {discount > 0 ? ` · Remise ${discount} %` : ''}
            </Text>

            <Text maxFontSizeMultiplier={1.4} style={styles.amount}>
              {`${formatPriceHT(totals.lineTotalHt)} HT · TVA ${formatVatRate(parseDecimalInput(line.vatRate) || 0)} · ${formatPriceHT(totals.lineTotalTtc)} TTC`}
            </Text>
          </View>
        );
      })}
    </Card>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    line: {
      gap: spacing[0.5],
    },
    separated: {
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separatorOpaque,
    },
    index: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
    },
    description: {
      ...typography.bodyMedium,
      color: colors.text,
    },
    meta: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    amount: {
      ...typography.subheadlineMedium,
      color: colors.primary,
    },
  }));
}
