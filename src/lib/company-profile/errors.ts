import { GENERIC_ERROR_MESSAGE, NETWORK_ERROR_MESSAGE } from '@/lib/errors/messages';

export function getCompanyProfileErrorMessage(message: string): string {
  switch (message) {
    case 'duplicate key value violates unique constraint "profiles_pkey"':
      return 'Ce profil existe déjà.';
    default: {
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
  }
}
