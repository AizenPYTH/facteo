import { Text, View, type ViewStyle } from 'react-native';

import { DocumentLinesSection } from '@/components/documents/document-lines-section';
import { Card } from '@/components/ui/card';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { formatDate } from '@/lib/format/date';
import { mapLinesToDocumentTotals } from '@/lib/quotes/mappers';
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
  const totals = mapLinesToDocumentTotals(quote.lines);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <QuoteStatusBadge status={quote.status} />
        </View>
        <Card variant="surface">
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
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prestations</Text>
        <DocumentLinesSection lines={quote.lines} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Totaux</Text>
        <QuoteTotals totals={totals} />
      </View>

      {quote.notes?.trim() ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Card variant="surface">
            <Text style={styles.notes}>{quote.notes.trim()}</Text>
          </Card>
        </View>
      ) : null}

      {quote.internalNotes?.trim() ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes internes</Text>
          <Card variant="subtle">
            <Text style={styles.notesMuted}>{quote.internalNotes.trim()}</Text>
          </Card>
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
