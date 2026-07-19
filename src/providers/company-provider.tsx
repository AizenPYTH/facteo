import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { useAuth } from '@/hooks/use-auth';
import { createCompany, fetchUserCompanies } from '@/lib/supabase/companies';
import { companiesQueryKeys } from '@/lib/supabase/query-keys';
import { clearTenantCache } from '@/lib/tenant/clear-tenant-cache';
import type { CreateCompanyInput, DataScope, TenantCompany } from '@/types/tenant';

const ACTIVE_COMPANY_KEY = 'factume:active-company-id';

type CompanyContextValue = {
  companies: TenantCompany[];
  activeCompany: TenantCompany | null;
  companyId: string | null;
  scope: DataScope | null;
  loading: boolean;
  isSwitching: boolean;
  switchCompany: (companyId: string) => Promise<void>;
  createNewCompany: (input: CreateCompanyInput) => Promise<string>;
};

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);

export function CompanyProvider({ children }: PropsWithChildren) {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const companiesQuery = useQuery({
    queryKey: companiesQueryKeys.list(user?.id ?? 'anonymous'),
    queryFn: () => fetchUserCompanies(user!.id),
    enabled: Boolean(user?.id) && !authLoading,
    staleTime: 60_000,
  });

  const companies = companiesQuery.data ?? [];

  useEffect(() => {
    if (!user?.id) {
      setActiveCompanyId(null);
      setHydrated(true);
      return;
    }

    let mounted = true;

    async function hydrate() {
      const stored = await AsyncStorage.getItem(`${ACTIVE_COMPANY_KEY}:${user!.id}`);
      if (mounted) {
        setActiveCompanyId(stored);
        setHydrated(true);
      }
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!hydrated || companies.length === 0) {
      return;
    }

    const isValid = activeCompanyId && companies.some((c) => c.id === activeCompanyId);

    if (!isValid) {
      const nextId = companies[0]?.id ?? null;
      setActiveCompanyId(nextId);
      if (user?.id && nextId) {
        void AsyncStorage.setItem(`${ACTIVE_COMPANY_KEY}:${user.id}`, nextId);
      }
    }
  }, [activeCompanyId, companies, hydrated, user?.id]);

  const switchCompany = useCallback(
    async (companyId: string) => {
      if (!user?.id || companyId === activeCompanyId) {
        return;
      }

      setIsSwitching(true);

      await queryClient.cancelQueries();
      clearTenantCache(queryClient);

      setActiveCompanyId(companyId);
      await AsyncStorage.setItem(`${ACTIVE_COMPANY_KEY}:${user.id}`, companyId);

      await queryClient.invalidateQueries({
        predicate: (query) => {
          const root = query.queryKey[0];
          return (
            root === 'dashboard' ||
            root === 'clients' ||
            root === 'quotes' ||
            root === 'invoices' ||
            root === 'settings' ||
            root === 'profiles'
          );
        },
      });

      setIsSwitching(false);
    },
    [activeCompanyId, queryClient, user?.id],
  );

  const createCompanyMutation = useMutation({
    mutationFn: createCompany,
    onSuccess: async (companyId) => {
      await queryClient.invalidateQueries({ queryKey: companiesQueryKeys.all });
      await switchCompany(companyId);
    },
  });

  const activeCompany = useMemo(
    () => companies.find((c) => c.id === activeCompanyId) ?? companies[0] ?? null,
    [activeCompanyId, companies],
  );

  const scope = useMemo<DataScope | null>(() => {
    if (!user?.id || !activeCompany?.id) {
      return null;
    }

    return { userId: user.id, companyId: activeCompany.id };
  }, [activeCompany?.id, user?.id]);

  const value = useMemo<CompanyContextValue>(
    () => ({
      companies,
      activeCompany,
      companyId: activeCompany?.id ?? null,
      scope,
      loading: authLoading || companiesQuery.isLoading || !hydrated,
      isSwitching,
      switchCompany,
      createNewCompany: createCompanyMutation.mutateAsync,
    }),
    [
      activeCompany,
      authLoading,
      companies,
      companiesQuery.isLoading,
      createCompanyMutation.mutateAsync,
      hydrated,
      isSwitching,
      scope,
      switchCompany,
    ],
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompanyContext() {
  const context = useContext(CompanyContext);

  if (!context) {
    throw new Error('useCompanyContext must be used within CompanyProvider');
  }

  return context;
}

export function useTenant() {
  return useCompanyContext();
}
