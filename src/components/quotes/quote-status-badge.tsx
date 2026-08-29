import { StatusChip, type StatusTone } from '@/components/ui/status-chip';
import type { QuoteStatus } from '@/types/quote';
import { QUOTE_STATUS_LABELS } from '@/types/quote';

type QuoteStatusBadgeProps = {
  status: QuoteStatus;
};

const TONE_BY_STATUS: Record<QuoteStatus, StatusTone> = {
  draft: 'draft',
  sent: 'sent',
  accepted: 'paid',
  rejected: 'overdue',
  expired: 'pending',
  converted: 'sent',
};

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  return <StatusChip label={QUOTE_STATUS_LABELS[status]} tone={TONE_BY_STATUS[status]} />;
}
