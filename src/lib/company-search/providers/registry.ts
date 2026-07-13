import { getCompanySearchProviderId } from '@/lib/company-search/config';
import { CompanySearchError } from '@/lib/company-search/errors';
import { rechercheEntreprisesProvider } from '@/lib/company-search/providers/recherche-entreprises';
import type { CompanySearchProvider } from '@/lib/company-search/providers/types';
import type { CompanySearchProviderId } from '@/lib/company-search/types';

const PROVIDERS: Record<CompanySearchProviderId, CompanySearchProvider> = {
  'recherche-entreprises': rechercheEntreprisesProvider,
};

export function getCompanySearchProvider(
  providerId: CompanySearchProviderId = getCompanySearchProviderId(),
): CompanySearchProvider {
  const provider = PROVIDERS[providerId];

  if (!provider) {
    throw new CompanySearchError('NOT_CONFIGURED');
  }

  return provider;
}

/** Permet d'enregistrer un fournisseur alternatif à l'exécution (tests ou migration). */
export function registerCompanySearchProvider(
  providerId: CompanySearchProviderId,
  provider: CompanySearchProvider,
): void {
  PROVIDERS[providerId] = provider;
}
