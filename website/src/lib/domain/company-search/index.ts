import { isCompanySearchConfigured } from '@/lib/company-search/config';
import { CompanySearchError } from '@/lib/company-search/errors';
import { getCompanySearchProvider } from '@/lib/company-search/providers/registry';
import type { CompanyLookupResult, CompanySearchOptions } from '@/lib/company-search/types';
import { isValidRegistrationNumber, normalizeRegistrationDigits } from '@/lib/company-search/validation';

export async function searchCompanyByRegistrationNumber(
  registrationNumber: string,
  options: CompanySearchOptions = {},
): Promise<CompanyLookupResult> {
  const digits = normalizeRegistrationDigits(registrationNumber);

  if (!isValidRegistrationNumber(digits)) {
    throw new CompanySearchError('INVALID_REGISTRATION_NUMBER');
  }

  if (!isCompanySearchConfigured()) {
    throw new CompanySearchError('NOT_CONFIGURED');
  }

  const provider = getCompanySearchProvider();
  const result = await provider.searchByRegistrationNumber(digits, options);

  if (!result) {
    throw new CompanySearchError('COMPANY_NOT_FOUND');
  }

  return result;
}

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
