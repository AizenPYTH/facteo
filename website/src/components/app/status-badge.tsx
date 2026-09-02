import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '@inveq/types/invoice';
import { QUOTE_STATUS_LABELS, type QuoteStatus } from '@inveq/types/quote';

import { cn } from '@/lib/utils';

type StatusTone = { bg: string; fg: string; dot: string };

const NEUTRAL: StatusTone = { bg: '#f3f5fa', fg: '#4a5268', dot: '#a3aabd' };
const ACCENT: StatusTone = { bg: '#f1efff', fg: '#4338ca', dot: '#4f46e5' };
const WARNING: StatusTone = { bg: '#fffbeb', fg: '#b45309', dot: '#f59e0b' };
const SUCCESS: StatusTone = { bg: '#ecfdf5', fg: '#047857', dot: '#059669' };
const DANGER: StatusTone = { bg: '#fef2f2', fg: '#b91c1c', dot: '#dc2626' };

const STATUS_TONES: Record<InvoiceStatus | QuoteStatus, StatusTone> = {
  draft: NEUTRAL,
  sent: ACCENT,
  partially_paid: WARNING,
  paid: SUCCESS,
  accepted: SUCCESS,
  converted: SUCCESS,
  overdue: DANGER,
  rejected: DANGER,
  expired: WARNING,
  canceled: NEUTRAL,
};

export function StatusBadge({
  kind,
  status,
  className,
}: {
  kind: 'invoice' | 'quote';
  status: string;
  className?: string;
}) {
  const tone = STATUS_TONES[status as InvoiceStatus | QuoteStatus] ?? NEUTRAL;
  const labels = kind === 'invoice' ? INVOICE_STATUS_LABELS : QUOTE_STATUS_LABELS;
  const label = labels[status as keyof typeof labels] ?? status;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-[9px] py-[3px] text-[11.5px] font-semibold',
        className,
      )}
      style={{ background: tone.bg, color: tone.fg }}>
      <span className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: tone.dot }} />
      {label}
    </span>
  );
}
