import type { CompanyLookupResult, CompanySearchOptions } from '@/lib/company-search/types';

export type CompanySearchProvider = {
  /** Recherche une entreprise par SIREN (9) ou SIRET (14), chiffres uniquement. */
  searchByRegistrationNumber: (
    registrationNumber: string,
    options?: CompanySearchOptions,
  ) => Promise<CompanyLookupResult | null>;
};
