import { GENERIC_ERROR_MESSAGE, NETWORK_ERROR_MESSAGE } from '@/lib/errors/messages';

export function mapPostgresErrorMessage(message: string): string | null {
  const normalized = message.toLowerCase();

  if (normalized.includes('column') && normalized.includes('does not exist')) {
    return 'La base de données doit être mise à jour. Exécutez les migrations Supabase.';
  }

  if (normalized.includes('relation') && normalized.includes('does not exist')) {
    return 'La base de données doit être mise à jour. Exécutez les migrations Supabase.';
  }

  if (
    normalized.includes('jwt expired') ||
    normalized.includes('invalid jwt') ||
    normalized.includes('not authenticated')
  ) {
    return 'Votre session a expiré. Reconnectez-vous.';
  }

  if (normalized.includes('plan_limit_reached')) {
    return 'Limite de votre offre atteinte pour ce mois.';
  }

  if (normalized.includes('permission denied') || normalized.includes('row-level security')) {
    return "Vous n'avez pas accès à cette ressource.";
  }

  if (normalized.includes('duplicate key')) {
    return 'Cette valeur existe déjà.';
  }

  return null;
}

export function resolveUserFacingError(
  message: string,
  domainMapper: (message: string) => string,
): string {
  if (!message.trim()) {
    return GENERIC_ERROR_MESSAGE;
  }

  const domainMessage = domainMapper(message);

  if (domainMessage !== GENERIC_ERROR_MESSAGE) {
    return domainMessage;
  }

  const postgresMessage = mapPostgresErrorMessage(message);

  if (postgresMessage) {
    return postgresMessage;
  }

  const normalized = message.toLowerCase();

  if (
    normalized.includes('network') ||
    normalized.includes('fetch') ||
    normalized.includes('failed to fetch')
  ) {
    return NETWORK_ERROR_MESSAGE;
  }

  return GENERIC_ERROR_MESSAGE;
}
