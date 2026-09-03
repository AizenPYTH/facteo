import { Text, View, type ViewStyle } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { PressableScale } from '@/components/ui/pressable-scale';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { invoiceStatusTone } from '@/lib/documents/status-tone';
import { formatPriceHT } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { INVOICE_STATUS_LABELS, type Invoice } from '@/types/invoice';

export type InvoiceCardProps = {
  invoice: Invoice;
  onPress?: (invoice: Invoice) => void;
  style?: ViewStyle;
  testID?: string;
};

/**
 * Ligne de la liste des factures.
 *
 * Remplace six champs étiquetés « Numéro / Client / Date / Montant TTC /
 * Échéance » empilés à poids égal : en liste on cherche un document, pas un
 * formulaire. Le numéro et le montant portent la lecture, le statut la
 * qualifie, l'échéance n'apparaît que lorsqu'elle informe.
 */
export function InvoiceCard({ invoice, onPress, style, testID }: InvoiceCardProps) {
  const styles = useStyles();
  const colors = useColors();

  const displayDate = formatDate(invoice.issuedAt ?? invoice.createdAt);
  const isLate = invoice.status === 'overdue';
  const dueLabel = invoice.dueAt
    ? `${isLate ? 'En retard depuis le' : 'Échéance'} ${formatDate(invoice.dueAt)}`
    : null;

  const content = (
    <View style={[styles.row, style]}>
      <View style={styles.leading}>
        <View style={styles.titleRow}>
          <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.number}>
            {invoice.number}
          </Text>
          <Badge
            label={INVOICE_STATUS_LABELS[invoice.status]}
            size="sm"
            tone={invoiceStatusTone[invoice.status]}
          />
        </View>

        <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.client}>
          {invoice.clientName}
        </Text>

        <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.meta}>
          {displayDate}
        </Text>
      </View>

      <View style={styles.trailing}>
        <Text
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.3}
          numberOfLines={1}
          style={styles.amount}>
          {formatPriceHT(invoice.totalTtc)}
        </Text>
        {dueLabel ? (
          <Text
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
            style={[styles.due, isLate && { color: colors.warning }]}>
            {dueLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (!onPress) {
    return (
      <View style={styles.wrapper} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <PressableScale
      accessibilityHint="Ouvre la facture"
      accessibilityLabel={`Facture ${invoice.number}, ${invoice.clientName}, ${formatPriceHT(invoice.totalTtc)}, ${INVOICE_STATUS_LABELS[invoice.status]}`}
      accessibilityRole="button"
      intensity="subtle"
      onPress={() => onPress(invoice)}
      style={styles.wrapper}
      testID={testID}>
      {content}
    </PressableScale>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    wrapper: {
      backgroundColor: colors.surface,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing[3],
      minHeight: 72,
    },
    leading: {
      flex: 1,
      minWidth: 0,
      gap: spacing[0.5],
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    number: {
      ...typography.bodySemibold,
      color: colors.text,
      flexShrink: 1,
    },
    client: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    meta: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    trailing: {
      alignItems: 'flex-end',
      gap: spacing[0.5],
      maxWidth: '42%',
    },
    amount: {
      ...typography.bodySemibold,
      color: colors.text,
    },
    due: {
      ...typography.caption1,
      color: colors.textSecondary,
      textAlign: 'right',
    },
  }));
}
