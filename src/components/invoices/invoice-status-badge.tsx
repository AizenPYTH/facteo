import { Badge } from '@/components/ui/badge';
import { invoiceStatusTone } from '@/lib/documents/status-tone';
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '@/types/invoice';

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus;
  size?: 'sm' | 'md';
};

/**
 * Statut d'une facture. Délègue au `Badge` du socle : la correspondance
 * statut → couleur vit désormais dans `lib/documents/status-tone`, unique pour
 * la liste, le détail et le tableau de bord.
 */
export function InvoiceStatusBadge({ status, size = 'md' }: InvoiceStatusBadgeProps) {
  return (
    <Badge label={INVOICE_STATUS_LABELS[status]} size={size} tone={invoiceStatusTone[status]} />
  );
}
