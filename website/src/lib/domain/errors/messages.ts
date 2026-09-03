export const GENERIC_ERROR_MESSAGE = 'Une erreur est survenue.';

export const NETWORK_ERROR_MESSAGE =
  'Impossible de contacter le serveur. Réessayez plus tard.';

export function isNetworkError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('network') ||
    normalized.includes('fetch') ||
    normalized.includes('failed to fetch')
  );
}

export function toUserFacingError(
  message: string,
  fallback: string = GENERIC_ERROR_MESSAGE,
): string {
  if (!message.trim()) {
    return fallback;
  }

  if (isNetworkError(message)) {
    return NETWORK_ERROR_MESSAGE;
  }

  if (message === 'PREMIUM_FEATURE_REQUIRED') {
    return 'Cette fonctionnalité n’est pas incluse dans votre offre actuelle.';
  }

  if (message.toUpperCase().includes('PLAN_LIMIT_REACHED')) {
    return 'Limite de votre offre atteinte pour ce mois.';
  }

  return message;
}
