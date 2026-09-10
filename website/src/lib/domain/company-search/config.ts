import type { CompanySearchProviderId } from '@/lib/company-search/types';

const SUPPORTED_PROVIDERS: CompanySearchProviderId[] = ['recherche-entreprises'];

/** API publique data.gouv / DINUM — Base Sirene (SIREN / SIRET). */
const DEFAULT_COMPANY_SEARCH_API_URL = 'https://recherche-entreprises.api.gouv.fr';

export function getCompanySearchApiBaseUrl(): string {
  // Next.js n’injecte `NEXT_PUBLIC_*` côté navigateur que via un accès STATIQUE
  // (`process.env.NEXT_PUBLIC_FOO`). Un `process.env[key]` reste `undefined`
  // dans le client, même si la variable est bien définie sur Vercel.
  const value = process.env.NEXT_PUBLIC_COMPANY_SEARCH_API_URL?.trim();
  return (value || DEFAULT_COMPANY_SEARCH_API_URL).replace(/\/$/, '');
}

export function getCompanySearchProviderId(): CompanySearchProviderId {
  const raw = process.env.NEXT_PUBLIC_COMPANY_SEARCH_PROVIDER?.trim();

  if (raw && SUPPORTED_PROVIDERS.includes(raw as CompanySearchProviderId)) {
    return raw as CompanySearchProviderId;
  }

  return 'recherche-entreprises';
}

export function isCompanySearchConfigured(): boolean {
  return getCompanySearchApiBaseUrl().length > 0;
}
