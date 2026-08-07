import { CLIENT_IDENTITY_ERROR } from '@/lib/clients/identity';
import { GENERIC_ERROR_MESSAGE } from '@/lib/errors/messages';
import { resolveUserFacingError } from '@/lib/errors/postgres';

export function getClientErrorMessage(message: string): string {
  return resolveUserFacingError(message, mapClientErrorMessage);
}

function mapClientErrorMessage(message: string): string {
  switch (message) {
    case 'User must be authenticated to create a client.':
    case 'User must be authenticated to update a client.':
    case 'User must be authenticated to delete a client.':
      return 'Vous devez être connecté pour effectuer cette action.';
    case CLIENT_IDENTITY_ERROR:
    case 'Client introuvable.':
      return message;
    default:
      // Messages métier déjà en français
      if (/[àâäéèêëïîôùûüç]/i.test(message) || message.includes('’')) {
        return message;
      }
      return GENERIC_ERROR_MESSAGE;
  }
}
