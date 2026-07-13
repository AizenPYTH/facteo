import { useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  getLookupRegistrationNumber,
  isValidRegistrationNumber,
  normalizeRegistrationDigits,
  searchCompanyByRegistrationNumber,
} from '@/lib/company-search';
import { companySearchQueryKeys } from '@/lib/supabase/query-keys';

const LOOKUP_DEBOUNCE_MS = 500;

export function useCompanyRegistrationLookup(
  siren: string,
  siret: string,
  lookupEnabled = true,
) {
  const registrationNumber = getLookupRegistrationNumber(siren, siret) ?? '';
  const debouncedRegistrationNumber = useDebouncedValue(registrationNumber, LOOKUP_DEBOUNCE_MS);
  const debouncedDigits = normalizeRegistrationDigits(debouncedRegistrationNumber);
  const isEnabled =
    lookupEnabled &&
    debouncedDigits.length > 0 &&
    isValidRegistrationNumber(debouncedDigits);

  const query = useQuery({
    queryKey: companySearchQueryKeys.lookup(debouncedDigits),
    queryFn: ({ signal }) => searchCompanyByRegistrationNumber(debouncedDigits, { signal }),
    enabled: isEnabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });

  const isTyping = registrationNumber !== debouncedRegistrationNumber;
  const hasCompleteInput = registrationNumber.length === 9 || registrationNumber.length === 14;
  const isInvalidInput =
    hasCompleteInput &&
    !isTyping &&
    debouncedDigits === registrationNumber &&
    !isValidRegistrationNumber(registrationNumber);

  return {
    ...query,
    registrationNumber,
    debouncedRegistrationNumber: debouncedDigits,
    isTyping,
    isInvalidInput,
    isLookupEnabled: isEnabled,
  };
}
