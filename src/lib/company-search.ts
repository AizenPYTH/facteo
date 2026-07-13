/**
 * Service public de recherche d'entreprise française (SIREN / SIRET).
 *
 * Configuration (variables d'environnement) :
 * - EXPO_PUBLIC_COMPANY_SEARCH_API_URL — URL de base de l'API (sans slash final)
 * - EXPO_PUBLIC_COMPANY_SEARCH_PROVIDER — identifiant du fournisseur (défaut : recherche-entreprises)
 *
 * Pour remplacer le fournisseur : implémenter `CompanySearchProvider` et l'enregistrer via
 * `registerCompanySearchProvider`.
 */

export { searchCompanyByRegistrationNumber } from '@/lib/company-search/index';

export {
  getCompanySearchApiBaseUrl,
  getCompanySearchProviderId,
  isCompanySearchConfigured,
} from '@/lib/company-search/config';

export {
  CompanySearchError,
  getCompanySearchErrorMessage,
  isCompanySearchError,
} from '@/lib/company-search/errors';

export {
  getLookupRegistrationNumber,
  isReadyForLookup,
  isValidRegistrationNumber,
  isValidSiren,
  isValidSiret,
  normalizeRegistrationDigits,
  registrationDigitsSchema,
} from '@/lib/company-search/validation';

export { computeFrenchVatNumberFromSiren } from '@/lib/company-search/vat';

export { registerCompanySearchProvider } from '@/lib/company-search/providers/registry';

export type { CompanySearchProvider } from '@/lib/company-search/providers/types';

export type {
  CompanyLookupResult,
  CompanySearchErrorCode,
  CompanySearchOptions,
  CompanySearchProviderId,
} from '@/lib/company-search/types';
