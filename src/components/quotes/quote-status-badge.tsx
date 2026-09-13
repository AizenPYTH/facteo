import { Badge } from '@/components/ui/badge';
import { quoteStatusTone } from '@/lib/documents/status-tone';
import { QUOTE_STATUS_LABELS, type QuoteStatus } from '@/types/quote';

type QuoteStatusBadgeProps = {
  status: QuoteStatus;
  size?: 'sm' | 'md';
};

/**
 * Statut d'un devis. Délègue au `Badge` du socle — même correspondance
 * statut → couleur que les factures, via `lib/documents/status-tone`.
 */
export function QuoteStatusBadge({ status, size = 'md' }: QuoteStatusBadgeProps) {
  return <Badge label={QUOTE_STATUS_LABELS[status]} size={size} tone={quoteStatusTone[status]} />;
}
