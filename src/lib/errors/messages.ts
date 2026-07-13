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

  return message;
}
