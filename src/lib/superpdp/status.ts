/**
 * Étapes réelles d'une facture électronique dans INVEQ.
 *
 * Ces valeurs ne sont pas décoratives : elles sont écrites en base par
 * l'intégration SUPER PDP (`supabase/functions/_shared/superpdp/status-map.ts`,
 * qui traduit les codes de la plateforme). Aucune étape n'est simulée côté app :
 * une facture qui n'a jamais été transmise n'a tout simplement pas de statut.
 */
export type ElectronicInvoiceStatus =
  | 'draft'
  | 'ready'
  | 'submitted'
  | 'delivered'
  | 'received'
  | 'accepted'
  | 'rejected'
  | 'paid'
  | 'cancelled'
  | 'error';

const LABELS: Record<ElectronicInvoiceStatus, string> = {
  draft: 'Brouillon',
  ready: 'Prête à transmettre',
  submitted: 'Transmise',
  delivered: 'Remise au destinataire',
  received: 'Reçue par le destinataire',
  accepted: 'Acceptée',
  rejected: 'Rejetée',
  paid: 'Encaissement signalé',
  cancelled: 'Annulée',
  error: 'Erreur de transmission',
};

/** Étapes en échec : à signaler visuellement, pas à présenter comme une progression. */
const FAILED: ElectronicInvoiceStatus[] = ['rejected', 'error', 'cancelled'];

export function isElectronicInvoiceStatus(value: string): value is ElectronicInvoiceStatus {
  return value in LABELS;
}

/** Libellé français, ou la valeur brute si la plateforme renvoie un code inconnu. */
export function formatElectronicInvoiceStatus(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  return isElectronicInvoiceStatus(normalized) ? LABELS[normalized] : value;
}

export function isElectronicInvoiceFailed(value: string | null | undefined): boolean {
  const normalized = value?.trim().toLowerCase();

  return Boolean(normalized && FAILED.includes(normalized as ElectronicInvoiceStatus));
}
