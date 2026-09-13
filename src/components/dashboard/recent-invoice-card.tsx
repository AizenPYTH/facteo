import { Text, View, type ViewStyle } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { ListRow } from '@/components/ui/list-row';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { invoiceStatusTone } from '@/lib/documents/status-tone';
import { formatCurrency } from '@/lib/format/currency';
import type { Invoice } from '@/types/dashboard';
import { INVOICE_STATUS_LABELS } from '@/types/invoice';

export type RecentInvoiceCardProps = {
  invoice: Invoice;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
};

/**
 * Ligne de facture du tableau de bord.
 *
 * Le statut manquait complètement : la ligne montrait un numéro, un client et
 * un montant, sans dire si la facture était payée, envoyée ou en retard.
 */
export function RecentInvoiceCard({ invoice, onPress, style, testID }: RecentInvoiceCardProps) {
  const styles = useStyles();

  return (
    <ListRow
      accessibilityHint="Ouvre la facture"
      onPress={onPress}
      style={style}
      subtitle={invoice.clientName}
      testID={testID}
      title={invoice.number}
      trailing={
        <View style={styles.trailing}>
          <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.amount}>
            {formatCurrency(invoice.amount)}
          </Text>
          <Badge
            label={INVOICE_STATUS_LABELS[invoice.status]}
            size="sm"
            tone={invoiceStatusTone[invoice.status]}
          />
        </View>
      }
    />
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    trailing: {
      alignItems: 'flex-end',
      gap: spacing[1],
    },
    amount: {
      ...typography.bodySemibold,
      color: colors.text,
    },
  }));
}
