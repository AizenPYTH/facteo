import { StatusBadge, type StatusTone } from '@/components/ui/status-badge';
import { QUOTE_STATUS_LABELS, type QuoteStatus } from '@/types/quote';

type QuoteStatusBadgeProps = {
  status: QuoteStatus;
};

const TONE_BY_STATUS: Record<QuoteStatus, StatusTone> = {
  draft: 'neutral',
  sent: 'primary',
  accepted: 'success',
  rejected: 'error',
  expired: 'warning',
  converted: 'primary',
};

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  return <StatusBadge label={QUOTE_STATUS_LABELS[status]} tone={TONE_BY_STATUS[status]} />;
}
