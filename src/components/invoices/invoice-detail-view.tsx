import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { DocumentLinesSection } from '@/components/documents/document-lines-section';
import { QuoteField } from '@/components/quotes/quote-field';
import { QuoteTotals } from '@/components/quotes/quote-totals';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { formatPriceHT } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { mapInvoiceLinesToDocumentTotals } from '@/lib/invoices/mappers';
import type { InvoiceDetail } from '@/types/invoice';

import { InvoiceStatusBadge } from './invoice-status-badge';

type InvoiceDetailViewProps = {
  invoice: InvoiceDetail;
  style?: ViewStyle;
  canAddPayment?: boolean;
  onAddPayment?: () => void;
};

export function InvoiceDetailView({
  invoice,
  style,
  canAddPayment = false,
  onAddPayment,
}: InvoiceDetailViewProps) {
  const styles = useStyles();
  const totals = mapInvoiceLinesToDocumentTotals(invoice.lines);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <InvoiceStatusBadge status={invoice.status} />
        </View>
        <Card variant="surface">
          <QuoteField emphasize label="Numéro" value={invoice.number} />
          <QuoteField label="Client" value={invoice.clientName} />
          {invoice.quoteId ? (
            <PressableScale
              accessibilityHint="Ouvre le devis dont cette facture est issue"
              accessibilityLabel="Voir le devis source"
              accessibilityRole="button"
              intensity="subtle"
              onPress={() => router.push(`/quotes/${invoice.quoteId}` as Href)}>
              <QuoteField emphasize label="Devis d’origine" value="Voir le devis source" />
            </PressableScale>
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
          {invoice.electronicInvoiceStatus ? (
            <QuoteField
              label="Facture électronique"
              value={
                invoice.superpdpInvoiceId
                  ? `${invoice.electronicInvoiceStatus} · SUPER PDP #${invoice.superpdpInvoiceId}`
                  : invoice.electronicInvoiceStatus
              }
            />
          ) : null}
          {invoice.electronicInvoiceLastError ? (
            <QuoteField label="Erreur e-facture" value={invoice.electronicInvoiceLastError} />
          ) : null}
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prestations</Text>
        <DocumentLinesSection lines={invoice.lines} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Totaux</Text>
        <QuoteTotals totals={totals} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historique des paiements</Text>
        <Card variant="surface">
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
        </Card>
      </View>

      {invoice.notes?.trim() ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Card variant="surface">
            <Text style={styles.notes}>{invoice.notes.trim()}</Text>
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
