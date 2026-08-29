import { StatusChip, type StatusTone } from '@/components/ui/status-chip';
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '@/types/invoice';

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus;
};

const TONE_BY_STATUS: Record<InvoiceStatus, StatusTone> = {
  draft: 'draft',
  sent: 'sent',
  partially_paid: 'pending',
  paid: 'paid',
  overdue: 'overdue',
  canceled: 'canceled',
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  return <StatusChip label={INVOICE_STATUS_LABELS[status]} tone={TONE_BY_STATUS[status]} />;
}
