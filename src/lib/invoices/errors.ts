import { GENERIC_ERROR_MESSAGE } from '@/lib/errors/messages';
import { resolveUserFacingError } from '@/lib/errors/postgres';

export function getInvoiceErrorMessage(message: string): string {
  return resolveUserFacingError(message, mapInvoiceErrorMessage);
}

function mapInvoiceErrorMessage(message: string): string {
  switch (message) {
    case 'User must be authenticated to create an invoice.':
    case 'User must be authenticated to update an invoice.':
    case 'User must be authenticated to cancel an invoice.':
    case 'User must be authenticated to mark an invoice as paid.':
    case 'User must be authenticated to add a payment.':
    case 'User must be authenticated to duplicate an invoice.':
      return 'Vous devez être connecté pour effectuer cette action.';
    case 'Invoice must have at least one line.':
      return 'Ajoutez au moins une prestation à la facture.';
    case 'Invoice not found.':
      return 'Facture introuvable.';
    case 'Invoice is not editable.':
      return 'Seules les factures en brouillon peuvent être modifiées.';
    case 'Quote not found.':
      return 'Devis introuvable.';
    case 'Quote already converted.':
      return 'Ce devis a déjà été converti en facture.';
    case 'Quote must be accepted before conversion.':
      return 'Seuls les devis acceptés peuvent être convertis en facture.';
    case 'Client is required.':
      return 'Sélectionnez un client.';
    case 'Invoice is already paid.':
      return 'Cette facture est déjà entièrement payée.';
    case 'Invalid payment amount.':
      return 'Montant de paiement invalide.';
    case 'Unable to reserve invoice number.':
      return 'Impossible de générer le numéro de facture.';
    case 'Unable to create invoice.':
      return 'Impossible de créer la facture.';
    case 'Unable to fetch updated invoice.':
    case 'Unable to fetch invoice.':
      return 'Impossible de charger la facture.';
    case 'Unable to add payment.':
      return "Impossible d'enregistrer le paiement.";
    case 'Stripe non configuré.':
      return 'Le paiement en ligne n’est pas encore configuré.';
    default: {
      if (message.includes('duplicate key') || message.includes('invoices_user_id_number_key')) {
        return 'Numéro de facture déjà utilisé. Réessayez.';
      }

      if (/[àâäéèêëïîôùûüç]/i.test(message) || message.includes('’') || message.includes("'")) {
        return message;
      }

      return GENERIC_ERROR_MESSAGE;
    }
  }
}
