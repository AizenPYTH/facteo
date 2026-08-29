import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { QuoteTotals } from '@/components/quotes/quote-totals';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { DateField } from '@/components/ui/date-field';
import { TextField } from '@/components/ui/text-field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatPriceHT, formatSpokenEuros } from '@/lib/format/currency';
import { mapLineValueToTotals } from '@/lib/quotes/mappers';
import type { DocumentTotals } from '@/lib/calculations/totals';
import type { QuoteInfoValues, QuoteLineValue } from '@/types/quote';

type DocumentFinalizeStepProps = {
  clientName: string;
  companyName?: string;
  lines: QuoteLineValue[];
  totals: DocumentTotals;
  info: QuoteInfoValues;
  onInfoChange: (info: QuoteInfoValues) => void;
  documentType: 'quote' | 'invoice';
  secondaryDateLabel?: string;
  secondaryDateValue?: string;
  onSecondaryDateChange?: (value: string) => void;
};

export function DocumentFinalizeStep({
  clientName,
  companyName,
  lines,
  totals,
  info,
  onInfoChange,
  documentType,
  secondaryDateLabel,
  secondaryDateValue,
  onSecondaryDateChange,
}: DocumentFinalizeStepProps) {
  const styles = useStyles();
  const colors = useColors();
  const expirationLabel =
    documentType === 'quote' ? "Date d'expiration" : "Date d'échéance";
  const secondaryDate = secondaryDateValue ?? info.validUntil;
  /** DESIGN §5.3 : nommer le document (« cette facture » / « ce devis »), jamais générique. */
  const documentDemonstrative = documentType === 'quote' ? 'ce devis' : 'cette facture';

  function updateField<K extends keyof QuoteInfoValues>(field: K, value: QuoteInfoValues[K]) {
    onInfoChange({ ...info, [field]: value });
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <Text style={styles.description}>
        Vérifiez les informations essentielles de {documentDemonstrative} avant d’enregistrer.
      </Text>

      <View style={styles.card}>
        {companyName ? (
          <>
            <Text style={styles.label}>Entreprise</Text>
            <Text style={styles.value}>{companyName}</Text>
            <View style={styles.divider} />
          </>
        ) : null}
        <Text style={styles.label}>Client</Text>
        <Text style={styles.value}>{clientName}</Text>
      </View>

      <View style={styles.card}>
        <DateField
          label="Date d'émission"
          onChange={(date) => updateField('issuedAt', date)}
          requirement="required"
          value={info.issuedAt}
        />
        <DateField
          label={secondaryDateLabel ?? expirationLabel}
          onChange={(date) => {
            if (onSecondaryDateChange) {
              onSecondaryDateChange(date);
              return;
            }

            updateField('validUntil', date);
          }}
          requirement="optional"
          value={secondaryDate}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Prestations ({lines.length})</Text>
        {lines.map((line, index) => {
          const lineTotals = mapLineValueToTotals(line);

          return (
            <View key={line.id} style={styles.lineRow}>
              <View style={styles.lineInfo}>
                <Text style={styles.lineTitle}>
                  {index + 1}. {line.description || 'Sans description'}
                </Text>
                <Text
                  accessibilityLabel={`${line.quantity} ${line.unit}, ${formatSpokenEuros(lineTotals.lineTotalHt)} hors taxes`}
                  style={styles.lineMeta}>
                  {line.quantity} {line.unit} · {formatPriceHT(lineTotals.lineTotalHt)} HT
                </Text>
              </View>
              <Text
                accessibilityLabel={formatSpokenEuros(lineTotals.lineTotalTtc)}
                style={styles.lineAmount}>
                {formatPriceHT(lineTotals.lineTotalTtc)}
              </Text>
            </View>
          );
        })}
        <QuoteTotals totals={totals} />
      </View>

      <CollapsibleSection title="Options avancées">
        <View style={styles.card}>
          <TextField
            keyboardType="number-pad"
            label="Délai de paiement (jours)"
            onChangeText={(text) => updateField('paymentTermsDays', text)}
            placeholder="30"
            value={info.paymentTermsDays}
          />
          <TextField
            label={
              documentType === 'quote'
                ? 'Notes (visibles sur le devis)'
                : 'Notes (visibles sur la facture)'
            }
            multiline
            numberOfLines={3}
            onChangeText={(text) => updateField('notes', text)}
            placeholder="Conditions particulières..."
            textAlignVertical="top"
            value={info.notes}
          />
          {documentType === 'quote' ? (
            <TextField
              label="Notes internes"
              multiline
              numberOfLines={2}
              onChangeText={(text) => updateField('internalNotes', text)}
              placeholder="Usage interne uniquement."
              textAlignVertical="top"
              value={info.internalNotes}
            />
          ) : null}
        </View>
      </CollapsibleSection>
    </ScrollView>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  container: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  description: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  label: {
    ...typography.caption2,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
  },
  sectionTitle: {
    ...typography.footnoteMedium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
}));
}
