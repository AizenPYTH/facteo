import type { CompanySearchErrorCode } from '@/lib/company-search/types';
import { PlanLimitError } from '@/types/subscription';

export class CompanySearchError extends Error {
  readonly code: CompanySearchErrorCode;

  constructor(code: CompanySearchErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'CompanySearchError';
    this.code = code;
  }
}

export function isCompanySearchError(error: unknown): error is CompanySearchError {
  return error instanceof CompanySearchError;
}

const USER_MESSAGES: Record<CompanySearchErrorCode, string> = {
  NOT_CONFIGURED: 'La recherche d\'entreprise n\'est pas configurée.',
  INVALID_REGISTRATION_NUMBER: 'SIREN ou SIRET invalide.',
  COMPANY_NOT_FOUND: 'Aucune entreprise trouvée pour ce numéro.',
  API_UNAVAILABLE: 'Service indisponible. Réessayez plus tard.',
  INVALID_RESPONSE: 'Réponse du service invalide. Réessayez plus tard.',
};

export function getCompanySearchErrorMessage(
  error: unknown,
  fallback = 'Impossible de rechercher l\'entreprise.',
): string {
  if (
    error instanceof PlanLimitError ||
    (error instanceof Error && error.message === 'PLAN_LIMIT_REACHED')
  ) {
    return 'Quota de recherches SIREN / SIRET atteint pour votre offre ce mois-ci.';
  }

  if (isCompanySearchError(error)) {
    return USER_MESSAGES[error.code] ?? fallback;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return '';
  }

  return fallback;
}
