import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatPriceHT } from '@/lib/format/currency';
import { mapQuoteLineValueToTotals } from '@/lib/quotes/mappers';
import type { DocumentTotals } from '@/lib/calculations/totals';
import type { QuoteLineValue } from '@/types/quote';

import { QuoteTotals } from './quote-totals';

type QuoteSummaryStepProps = {
  clientName: string;
  lines: QuoteLineValue[];
  totals: DocumentTotals;
};

export function QuoteSummaryStep({ clientName, lines, totals }: QuoteSummaryStepProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <Text style={styles.description}>
        Vérifiez le récapitulatif avant d'enregistrer le devis.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client</Text>
        <Text style={styles.clientName}>{clientName}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lignes ({lines.length})</Text>
        {lines.map((line, index) => {
          const lineTotals = mapQuoteLineValueToTotals(line);

          return (
            <View key={line.id} style={styles.lineRow}>
              <View style={styles.lineInfo}>
                <Text style={styles.lineTitle}>
                  {index + 1}. {line.description}
                </Text>
                <Text style={styles.lineMeta}>
                  {line.quantity} {line.unit} · {formatPriceHT(lineTotals.lineTotalHt)} HT
                </Text>
              </View>
              <Text style={styles.lineAmount}>{formatPriceHT(lineTotals.lineTotalTtc)}</Text>
            </View>
          );
        })}
      </View>

      <QuoteTotals totals={totals} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  description: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.footnoteMedium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  clientName: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  lineInfo: {
    flex: 1,
    gap: 2,
  },
  lineTitle: {
    ...typography.subheadlineMedium,
    color: colors.text,
  },
  lineMeta: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  lineAmount: {
    ...typography.subheadlineMedium,
    color: colors.text,
  },
});
