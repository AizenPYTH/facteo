import { StatusPill } from '@/components/ui/status-pill';
import { useColors } from '@/hooks/use-colors';
import { QUOTE_STATUS_LABELS, type QuoteStatus } from '@/types/quote';

type QuoteStatusBadgeProps = {
  status: QuoteStatus;
};

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  const colors = useColors();
  const palette = getStatusColors(colors)[status];

  return (
    <StatusPill
      backgroundColor={palette.background}
      label={QUOTE_STATUS_LABELS[status]}
      textColor={palette.text}
    />
  );
}

function getStatusColors(colors: ReturnType<typeof useColors>) {
  return {
    draft: { background: colors.backgroundSecondary, text: colors.textSecondary },
    sent: { background: colors.primarySubtle, text: colors.primary },
    accepted: { background: colors.successSubtle, text: colors.success },
    rejected: { background: colors.errorSubtle, text: colors.error },
    expired: { background: colors.warningSubtle, text: colors.warning },
    converted: { background: colors.primarySubtle, text: colors.primary },
  } satisfies Record<QuoteStatus, { background: string; text: string }>;
}
