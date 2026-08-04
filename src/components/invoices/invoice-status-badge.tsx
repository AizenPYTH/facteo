import { StatusBadge, type StatusTone } from '@/components/ui/status-badge';
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '@/types/invoice';

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus;
};

const TONE_BY_STATUS: Record<InvoiceStatus, StatusTone> = {
  draft: 'neutral',
  sent: 'primary',
  partially_paid: 'info',
  paid: 'success',
  overdue: 'warning',
  canceled: 'error',
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  return <StatusBadge label={INVOICE_STATUS_LABELS[status]} tone={TONE_BY_STATUS[status]} />;
}
