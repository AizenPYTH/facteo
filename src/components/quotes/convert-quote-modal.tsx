import { ConfirmationSheet } from '@/components/ui/confirmation-sheet';
import { formatDate } from '@/lib/format/date';
import { formatPriceHT } from '@/lib/format/currency';
import { computeDueDate } from '@/lib/supabase/settings';
import { QUOTE_STATUS_LABELS, type QuoteDetail } from '@/types/quote';

type ConvertQuoteModalProps = {
  quote: QuoteDetail;
  visible: boolean;
  loading?: boolean;
  /** Délai de paiement par défaut (réglages société), si le devis n'en fixe pas. */
  defaultPaymentTermsDays?: number;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Conversion devis → facture — DESIGN §3.6 / §5.4.
 * Pas de conversion immédiate : tableau de conséquences puis confirmation.
 * La facture est créée en brouillon, rien n'est envoyé.
 */
export function ConvertQuoteModal({
  quote,
  visible,
  loading = false,
  defaultPaymentTermsDays = 30,
  onConfirm,
  onCancel,
}: ConvertQuoteModalProps) {
  const dueDate =
    quote.validUntil ?? computeDueDate(quote.paymentTermsDays ?? defaultPaymentTermsDays);

  return (
    <ConfirmationSheet
      cancelLabel="Annuler"
      description="La facture sera créée immédiatement, avant tout envoi."
      note="Rien n'est envoyé au client : la facture reste en brouillon jusqu'à ce que vous l'envoyiez."
      onCancel={onCancel}
      onConfirm={onConfirm}
      primaryLabel="Convertir en facture"
      primaryLoading={loading}
      rows={[
        { label: 'Numéro attribué', value: 'Brouillon — attribué à la création' },
        { label: 'Montant', value: formatPriceHT(quote.totalTtc) },
        { label: 'Échéance calculée', value: formatDate(dueDate) },
        { label: 'Nouvel état du devis', value: QUOTE_STATUS_LABELS.converted },
      ]}
      title="Convertir ce devis en facture ?"
      visible={visible}
    />
  );
}
