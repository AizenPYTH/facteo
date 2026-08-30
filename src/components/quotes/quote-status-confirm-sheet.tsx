import { ConfirmationSheet } from '@/components/ui/confirmation-sheet';
import { QUOTE_STATUS_LABELS, type QuoteStatus } from '@/types/quote';

type StatusCopy = {
  title: string;
  primaryLabel: string;
  note: string;
};

const STATUS_COPY: Partial<Record<QuoteStatus, StatusCopy>> = {
  sent: {
    title: 'Marquer ce devis comme envoyé ?',
    primaryLabel: 'Marquer comme envoyé',
    note: "Le statut change seul, aucun e-mail n'est envoyé au client.",
  },
  accepted: {
    title: 'Marquer ce devis comme accepté ?',
    primaryLabel: 'Marquer comme accepté',
    note: 'Le client n’est pas notifié automatiquement de ce changement.',
  },
  rejected: {
    title: 'Marquer ce devis comme refusé ?',
    primaryLabel: 'Marquer comme refusé',
    note: 'Le client n’est pas notifié automatiquement de ce changement.',
  },
  expired: {
    title: 'Marquer ce devis comme expiré ?',
    primaryLabel: 'Marquer comme expiré',
    note: 'Le client n’est pas notifié automatiquement de ce changement.',
  },
};

type QuoteStatusConfirmSheetProps = {
  visible: boolean;
  currentStatus: QuoteStatus;
  targetStatus: QuoteStatus | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Changement de statut d'un devis — confirmation obligatoire (DESIGN §5.4).
 * Pas de « êtes-vous sûr » : le tableau montre le statut actuel et le nouveau.
 */
export function QuoteStatusConfirmSheet({
  visible,
  currentStatus,
  targetStatus,
  loading = false,
  onConfirm,
  onCancel,
}: QuoteStatusConfirmSheetProps) {
  if (!targetStatus) {
    return null;
  }

  const copy = STATUS_COPY[targetStatus] ?? {
    title: 'Confirmer ce changement de statut ?',
    primaryLabel: 'Confirmer',
    note: 'Le client n’est pas notifié automatiquement de ce changement.',
  };

  return (
    <ConfirmationSheet
      cancelLabel="Annuler"
      note={copy.note}
      onCancel={onCancel}
      onConfirm={onConfirm}
      primaryLabel={copy.primaryLabel}
      primaryLoading={loading}
      rows={[
        { label: 'Statut actuel', value: QUOTE_STATUS_LABELS[currentStatus] },
        { label: 'Nouveau statut', value: QUOTE_STATUS_LABELS[targetStatus] },
      ]}
      title={copy.title}
      visible={visible}
    />
  );
}
