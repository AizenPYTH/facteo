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
    case 'Impossible de démarrer la connexion Google.':
    case 'La connexion Google a échoué.':
    case 'Réponse Google invalide.':
      return message;
    default:
      return GENERIC_ERROR_MESSAGE;
  }
}
