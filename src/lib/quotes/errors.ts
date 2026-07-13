import { GENERIC_ERROR_MESSAGE } from '@/lib/errors/messages';
import { resolveUserFacingError } from '@/lib/errors/postgres';

export function getQuoteErrorMessage(message: string): string {
  return resolveUserFacingError(message, mapQuoteErrorMessage);
}

function mapQuoteErrorMessage(message: string): string {
  switch (message) {
    case 'User must be authenticated to create a quote.':
    case 'User must be authenticated to update a quote.':
    case 'User must be authenticated to delete a quote.':
    case 'User must be authenticated to duplicate a quote.':
    case 'User must be authenticated to convert a quote.':
      return 'Vous devez être connecté pour effectuer cette action.';
    case 'Quote must have at least one line.':
      return 'Ajoutez au moins une prestation au devis.';
    case 'Client is required.':
      return 'Sélectionnez un client.';
    case 'Quote not found.':
      return 'Devis introuvable.';
    case 'Quote is not editable.':
      return 'Seuls les devis en brouillon peuvent être modifiés.';
    case 'Unable to reserve quote number.':
      return 'Impossible de générer le numéro de devis.';
    case 'Unable to create quote.':
      return 'Impossible de créer le devis.';
    case 'Unable to fetch updated quote.':
    case 'Unable to fetch quote.':
      return 'Impossible de charger le devis.';
    case 'Quote must be accepted before conversion.':
      return 'Seuls les devis acceptés peuvent être convertis en facture.';
    case 'Quote already converted.':
      return 'Ce devis a déjà été converti en facture.';
    default: {
      if (message.includes('duplicate key') || message.includes('quotes_user_id_number_key')) {
        return 'Numéro de devis déjà utilisé. Réessayez.';
      }

      return GENERIC_ERROR_MESSAGE;
    }
  }
}
