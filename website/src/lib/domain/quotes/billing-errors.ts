/**
 * Messages des règles de facturation d'un devis (acomptes, solde), appliquées
 * en base. Communs au site et à l'application.
 */
const BILLING_ERROR_MESSAGES: Record<string, string> = {
  QUOTE_NOT_FOUND: 'Devis introuvable.',
  QUOTE_NOT_ACCEPTED: 'Le devis doit être accepté avant d’être facturé.',
  QUOTE_ALREADY_INVOICED: 'Ce devis a déjà sa facture finale (facture ou solde).',
  QUOTE_EMPTY: 'Le devis n’a aucun montant à facturer.',
  CLIENT_REQUIRED: 'Le devis doit avoir un client.',
  DEPOSIT_INVALID: 'Indiquez un pourcentage entre 0 et 100 % ou un montant positif.',
  DEPOSIT_TOO_SMALL: 'L’acompte est trop faible.',
  DEPOSIT_EXCEEDS_REMAINING: 'L’acompte dépasse le reste à facturer sur ce devis : il doit rester un solde.',
  DEPOSIT_HAS_BALANCE: 'Annulez d’abord la facture de solde qui déduit cet acompte.',
  QUOTE_HAS_DEPOSITS: 'Ce devis a déjà des acomptes : créez la facture de solde.',
  QUOTE_OVERBILLED: 'Le total facturé dépasserait le montant du devis.',
  BALANCE_INCONSISTENT: 'Les acomptes ne correspondent plus au devis : vérifiez-les avant de créer le solde.',
  Unauthorized: 'Vous n’avez pas accès à ce document.',
};

export const BILLING_ERROR_CODES = Object.keys(BILLING_ERROR_MESSAGES);

/** Code d'erreur métier trouvé dans un message Postgres, sinon null. */
export function findBillingErrorCode(message: string | null | undefined): string | null {
  if (!message) return null;
  return BILLING_ERROR_CODES.find((code) => message.includes(code)) ?? null;
}

export function billingErrorMessage(error: unknown): string {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error ?? '');
  const code = findBillingErrorCode(message);
  if (code) {
    const detail =
      error && typeof error === 'object' && 'details' in error && typeof error.details === 'string' ? error.details : '';
    return detail ? `${BILLING_ERROR_MESSAGES[code]} ${detail}` : BILLING_ERROR_MESSAGES[code];
  }
  return 'L’opération a échoué. Réessayez.';
}

/** Vrai si le message est déjà un message lisible des règles de facturation. */
export function isBillingErrorText(message: string): boolean {
  return Object.values(BILLING_ERROR_MESSAGES).some((text) => message.startsWith(text))
    || message === 'L’opération a échoué. Réessayez.';
}
