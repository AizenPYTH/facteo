import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatDate } from '@/lib/format/date';
import { formatPriceHT } from '@/lib/format/currency';
import { mapLinesToDocumentTotals, mapLineValueToTotals } from '@/lib/quotes/mappers';
import type { QuoteDetail } from '@/types/quote';

import { QuoteField } from './quote-field';
import { QuoteStatusBadge } from './quote-status-badge';
import { QuoteTotals } from './quote-totals';

type QuoteDetailViewProps = {
  quote: QuoteDetail;
  style?: ViewStyle;
};

export function QuoteDetailView({ quote, style }: QuoteDetailViewProps) {
  const styles = useStyles();
  const colors = useColors();
  const totals = mapLinesToDocumentTotals(quote.lines);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <QuoteStatusBadge status={quote.status} />
        </View>
        <View style={styles.card}>
          <QuoteField emphasize label="Numéro" value={quote.number} />
          <QuoteField label="Client" value={quote.clientName} />
          <QuoteField
            label="Date d'émission"
            value={formatDate(quote.issuedAt ?? quote.createdAt)}
          />
          {quote.validUntil ? (
            <QuoteField label="Valable jusqu'au" value={formatDate(quote.validUntil)} />
          ) : null}
          {quote.paymentTermsDays ? (
            <QuoteField
              label="Délai de paiement"
              value={`${quote.paymentTermsDays} jours`}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prestations</Text>
        <View style={styles.card}>
          {quote.lines.map((line, index) => {
            const lineTotals = mapLineValueToTotals(line);

            return (
              <View key={line.id} style={index > 0 ? styles.lineSeparator : undefined}>
                <Text style={styles.lineTitle}>Prestation {index + 1}</Text>
                <Text style={styles.lineDescription}>{line.description}</Text>
                <Text style={styles.lineMeta}>
                  {line.quantity} {line.unit} × {formatPriceHT(Number(line.unitPrice.replace(',', '.')) || 0)} HT
                  {Number(line.discountPercent.replace(',', '.')) > 0
                    ? ` · Remise ${line.discountPercent} %`
                    : ''}
                </Text>
                <Text style={styles.lineAmount}>
                  {formatPriceHT(lineTotals.lineTotalHt)} HT · TVA {line.vatRate} % ·{' '}
                  {formatPriceHT(lineTotals.lineTotalTtc)} TTC
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Totaux</Text>
        <QuoteTotals totals={totals} />
      </View>

      {quote.notes?.trim() ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notes}>{quote.notes.trim()}</Text>
          </View>
        </View>
      ) : null}

      {quote.internalNotes?.trim() ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes internes</Text>
          <View style={styles.card}>
            <Text style={styles.notesMuted}>{quote.internalNotes.trim()}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  container: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  lineSeparator: {
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  lineTitle: {
    ...typography.footnoteMedium,
    color: colors.textSecondary,
  },
  lineDescription: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  lineMeta: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  lineAmount: {
    ...typography.subheadlineMedium,
    color: colors.primary,
  },
  notes: {
    ...typography.body,
    color: colors.text,
  },
  notesMuted: {
    ...typography.body,
    color: colors.textSecondary,
  },
}));
}
