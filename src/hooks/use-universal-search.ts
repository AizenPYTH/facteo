import { useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import {
  searchUniversal,
  type UniversalSearchResults,
} from '@/lib/supabase/universal-search';

const DEBOUNCE_MS = 250;

const emptyResults: UniversalSearchResults = {
  clients: [],
  quotes: [],
  invoices: [],
};

export function useUniversalSearch(search: string) {
  const { scope, loading: tenantLoading, isSwitching } = useTenant();
  const debounced = useDebouncedValue(search, DEBOUNCE_MS);
  const term = debounced.trim();

  const query = useQuery({
    queryKey: ['universal-search', scope?.companyId ?? 'anonymous', term],
    queryFn: () => searchUniversal(requireScope(scope), term),
    enabled: Boolean(scope?.companyId) && term.length > 0 && !tenantLoading && !isSwitching,
    staleTime: 15_000,
    placeholderData: emptyResults,
  });

  return {
    term,
    debouncedTerm: term,
    isSearching: term.length > 0,
    isLoading: Boolean(term) && (query.isLoading || query.isFetching),
    results: term ? (query.data ?? emptyResults) : emptyResults,
    error: query.error,
  };
}
