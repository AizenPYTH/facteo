import type { CompanySearchProviderId } from '@/lib/company-search/types';

const SUPPORTED_PROVIDERS: CompanySearchProviderId[] = ['recherche-entreprises'];

/** API publique data.gouv — aucune clé requise. */
export const DEFAULT_COMPANY_SEARCH_API_URL = 'https://recherche-entreprises.api.gouv.fr';

export function getCompanySearchApiBaseUrl(): string {
  const value = process.env.EXPO_PUBLIC_COMPANY_SEARCH_API_URL?.trim();
  return value && value.length > 0
    ? value.replace(/\/$/, '')
    : DEFAULT_COMPANY_SEARCH_API_URL;
}

export function getCompanySearchProviderId(): CompanySearchProviderId {
  const raw = process.env.EXPO_PUBLIC_COMPANY_SEARCH_PROVIDER?.trim();

  if (raw && SUPPORTED_PROVIDERS.includes(raw as CompanySearchProviderId)) {
    return raw as CompanySearchProviderId;
  }

  return 'recherche-entreprises';
}

export function isCompanySearchConfigured(): boolean {
  return getCompanySearchApiBaseUrl().length > 0;
}
