import { StatusPill } from '@/components/ui/status-pill';
import { useColors } from '@/hooks/use-colors';
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '@/types/invoice';

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus;
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const colors = useColors();
  const palette = getStatusColors(colors)[status];

  return (
    <StatusPill
      backgroundColor={palette.background}
      label={INVOICE_STATUS_LABELS[status]}
      textColor={palette.text}
    />
  );
}

function getStatusColors(colors: ReturnType<typeof useColors>) {
  return {
    draft: { background: colors.backgroundSecondary, text: colors.textSecondary },
    sent: { background: colors.primarySubtle, text: colors.primary },
    partially_paid: { background: colors.infoSubtle, text: colors.info },
    paid: { background: colors.successSubtle, text: colors.success },
    overdue: { background: colors.warningSubtle, text: colors.warning },
    canceled: { background: colors.errorSubtle, text: colors.error },
  } satisfies Record<InvoiceStatus, { background: string; text: string }>;
}
