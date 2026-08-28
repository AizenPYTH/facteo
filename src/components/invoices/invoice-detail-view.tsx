import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { QuoteField } from '@/components/quotes/quote-field';
import { QuoteTotals } from '@/components/quotes/quote-totals';
import { Button } from '@/components/ui/button';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatDate } from '@/lib/format/date';
import { formatPriceHT } from '@/lib/format/currency';
import { mapInvoiceLineValueToTotals, mapInvoiceLinesToDocumentTotals } from '@/lib/invoices/mappers';
import {
  INVOICE_DOCUMENT_KIND_LABELS,
  VAT_REGIME_LABELS,
  type InvoiceDetail,
  type InvoiceRevision,
} from '@/types/invoice';

import { InvoiceStatusBadge } from './invoice-status-badge';

type InvoiceDetailViewProps = {
  invoice: InvoiceDetail;
  style?: ViewStyle;
  canAddPayment?: boolean;
  onAddPayment?: () => void;
  revisions?: InvoiceRevision[];
};

export function InvoiceDetailView({
  invoice,
  style,
  canAddPayment = false,
  onAddPayment,
  revisions = [],
}: InvoiceDetailViewProps) {
  const styles = useStyles();
  const colors = useColors();
  const totals = mapInvoiceLinesToDocumentTotals(invoice.lines);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.badgeRow}>
            {invoice.documentKind === 'credit_note' ? (
              <View style={[styles.kindBadge, { backgroundColor: colors.infoSubtle }]}>
                <Text style={[styles.kindBadgeText, { color: colors.info }]}>
                  {INVOICE_DOCUMENT_KIND_LABELS.credit_note}
                </Text>
              </View>
            ) : null}
            <InvoiceStatusBadge status={invoice.status} />
          </View>
        </View>
        <View style={styles.card}>
          <QuoteField emphasize label="Numéro" value={invoice.number} />
          <QuoteField label="Client" value={invoice.clientName} />
          {invoice.documentKind === 'credit_note' && invoice.creditOfInvoiceId ? (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push(`/invoices/${invoice.creditOfInvoiceId}` as Href)
              }>
              <QuoteField emphasize label="Facture d’origine" value="Voir la facture source" />
            </Pressable>
          ) : null}
          {invoice.quoteId ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/quotes/${invoice.quoteId}` as Href)}>
              <QuoteField emphasize label="Devis d’origine" value="Voir le devis source" />
            </Pressable>
          ) : null}
          <QuoteField
            label="Date d’émission"
            value={formatDate(invoice.issuedAt ?? invoice.createdAt)}
          />
          {invoice.dueAt ? (
            <QuoteField label="Date d'échéance" value={formatDate(invoice.dueAt)} />
          ) : null}
          {invoice.paidAt ? (
            <QuoteField label="Date de paiement" value={formatDate(invoice.paidAt)} />
          ) : null}
          {invoice.vatRegime ? (
            <QuoteField label="Régime de TVA" value={VAT_REGIME_LABELS[invoice.vatRegime]} />
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prestations</Text>
        <View style={styles.card}>
          {invoice.lines.map((line, index) => {
            const lineTotals = mapInvoiceLineValueToTotals(line);

            return (
              <View key={line.id} style={index > 0 ? styles.lineSeparator : undefined}>
                <Text style={styles.lineTitle}>Prestation {index + 1}</Text>
                <Text style={styles.lineDescription}>{line.description}</Text>
                <Text style={styles.lineMeta}>
                  {line.quantity} {line.unit} ×{' '}
                  {formatPriceHT(Number(line.unitPrice.replace(',', '.')) || 0)} HT
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historique des paiements</Text>
        <View style={styles.card}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Total TTC</Text>
            <Text style={styles.paymentValue}>{formatPriceHT(invoice.totalTtc)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Déjà payé</Text>
            <Text style={styles.paymentValue}>{formatPriceHT(invoice.amountPaid)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabelDue}>Reste à payer</Text>
            <Text style={styles.paymentValueDue}>{formatPriceHT(invoice.amountDue)}</Text>
          </View>

          {invoice.payments.length > 0 ? (
            <View style={styles.paymentsList}>
              {invoice.payments.map((payment, index) => (
                <View
                  key={payment.id}
                  style={index > 0 ? styles.paymentItemSeparator : undefined}>
                  <View style={styles.paymentItemHeader}>
                    <Text style={styles.paymentItemDate}>{formatDate(payment.paidAt)}</Text>
                    <Text style={styles.paymentItemAmount}>{formatPriceHT(payment.amount)}</Text>
                  </View>
                  {payment.paymentMethod ? (
                    <Text style={styles.paymentItemMeta}>Mode : {payment.paymentMethod}</Text>
                  ) : null}
                  {payment.paymentReference ? (
                    <Text style={styles.paymentItemMeta}>Réf. {payment.paymentReference}</Text>
                  ) : null}
                  {payment.notes?.trim() ? (
                    <Text style={styles.paymentItemNotes}>{payment.notes.trim()}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPayments}>
              <Text style={styles.noPayments}>Aucun paiement enregistré.</Text>
              {canAddPayment && onAddPayment ? (
                <Button
                  onPress={onAddPayment}
                  title="Enregistrer un paiement"
                  variant="ghost"
                />
              ) : null}
            </View>
          )}
        </View>
      </View>

      {invoice.notes?.trim() ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notes}>{invoice.notes.trim()}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historique des révisions</Text>
        <View style={styles.card}>
          {revisions.length === 0 ? (
            <Text style={styles.noPayments}>Aucune révision enregistrée.</Text>
          ) : (
            revisions.map((revision, index) => (
              <View
                key={revision.id}
                style={index > 0 ? styles.paymentItemSeparator : undefined}>
                <View style={styles.paymentItemHeader}>
                  <Text style={styles.paymentItemDate}>
                    Révision {revision.revision} · {formatDate(revision.createdAt)}
                  </Text>
                </View>
                <Text style={styles.paymentItemMeta}>
                  {revision.reason?.trim() || 'Modification enregistrée'}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  kindBadge: {
    borderRadius: radius.badge,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  kindBadgeText: {
    ...typography.caption1,
    fontWeight: '600',
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
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  paymentLabel: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  paymentValue: {
    ...typography.subheadlineMedium,
    color: colors.text,
  },
  paymentLabelDue: {
    ...typography.headline,
    color: colors.text,
  },
  paymentValueDue: {
    ...typography.headline,
    color: colors.primary,
  },
  paymentsList: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
    gap: spacing.sm,
  },
  paymentItemSeparator: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  paymentItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  paymentItemDate: {
    ...typography.footnoteMedium,
    color: colors.textSecondary,
  },
  paymentItemAmount: {
    ...typography.subheadlineMedium,
    color: colors.text,
  },
  paymentItemMeta: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  paymentItemNotes: {
    ...typography.footnote,
    color: colors.text,
    fontStyle: 'italic',
  },
  noPayments: {
    ...typography.footnote,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyPayments: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  notes: {
    ...typography.body,
    color: colors.text,
  },
}));
}
