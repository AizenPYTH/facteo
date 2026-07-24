import { GENERIC_ERROR_MESSAGE } from '@/lib/errors/messages';
import { resolveUserFacingError } from '@/lib/errors/postgres';

export function getAuthErrorMessage(message: string): string {
  return resolveUserFacingError(message, mapAuthErrorMessage);
}

function mapAuthErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('provider is not enabled') || normalized.includes('unsupported provider')) {
    return 'La connexion Google n’est pas encore activée. Réessayez plus tard ou utilisez votre e-mail.';
  }
  if (normalized.includes('popup') || normalized.includes('cancelled') || normalized.includes('canceled')) {
    return 'Connexion Google annulée.';
  }

  switch (message) {
    case 'Invalid login credentials':
      return 'Adresse e-mail ou mot de passe incorrect.';
    case 'Email not confirmed':
      return 'Veuillez confirmer votre adresse e-mail avant de vous connecter.';
    case 'User already registered':
      return 'Un compte existe déjà avec cette adresse e-mail.';
    default:
      return GENERIC_ERROR_MESSAGE;
  }
}
