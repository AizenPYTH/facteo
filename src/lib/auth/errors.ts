import { GENERIC_ERROR_MESSAGE } from '@/lib/errors/messages';
import { resolveUserFacingError } from '@/lib/errors/postgres';

export function getAuthErrorMessage(message: string): string {
  return resolveUserFacingError(message, mapAuthErrorMessage);
}

function mapAuthErrorMessage(message: string): string {
  switch (message) {
    case 'Invalid login credentials':
      return 'Adresse e-mail ou mot de passe incorrect.';
    case 'Email not confirmed':
      return 'Veuillez confirmer votre adresse e-mail avant de vous connecter.';
    case 'User already registered':
      return 'Un compte existe déjà avec cette adresse e-mail.';
    default:
      if (
        message.toLowerCase().includes('already') &&
        message.toLowerCase().includes('email')
      ) {
        return 'Un compte INVEQ existe déjà avec cet e-mail. Connectez-vous avec le même compte pour éviter un doublon.';
      }
      // Préserver les messages déjà localisés (ex. mapAppleAuthError) —
      // ne pas les écraser par le libellé générique.
      if (
        /[àâäéèêëïîôùûüçœ]/i.test(message) ||
        /connexion|impossible|vérifiez|compte inveq|sign in with apple|jeton apple/i.test(
          message,
        )
      ) {
        return message;
      }
      return GENERIC_ERROR_MESSAGE;
  }
}
