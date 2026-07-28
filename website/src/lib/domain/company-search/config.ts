import type { CompanySearchProviderId } from '@/lib/company-search/types';
import { readPublicEnv } from '@/lib/runtime';

const SUPPORTED_PROVIDERS: CompanySearchProviderId[] = ['recherche-entreprises'];

/** API publique data.gouv — aucune clé requise. */
export const DEFAULT_COMPANY_SEARCH_API_URL = 'https://recherche-entreprises.api.gouv.fr';

export function getCompanySearchApiBaseUrl(): string {
  const value = readPublicEnv('NEXT_PUBLIC_COMPANY_SEARCH_API_URL');
  return (value ? value.replace(/\/$/, '') : DEFAULT_COMPANY_SEARCH_API_URL);
}

export function getCompanySearchProviderId(): CompanySearchProviderId {
  const raw = readPublicEnv('NEXT_PUBLIC_COMPANY_SEARCH_PROVIDER');

  if (raw && SUPPORTED_PROVIDERS.includes(raw as CompanySearchProviderId)) {
    return raw as CompanySearchProviderId;
  }

  return 'recherche-entreprises';
}

export function isCompanySearchConfigured(): boolean {
  return getCompanySearchApiBaseUrl().length > 0;
}
