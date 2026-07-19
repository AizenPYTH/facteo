'use client';

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

import { useAuth } from '@/providers/auth-provider';
import { createCompany, fetchUserCompanies } from '@/lib/domain/supabase/companies';
import { assertPlanLimit } from '@/lib/domain/supabase/subscriptions';
import { companiesQueryKeys } from '@/lib/domain/supabase/query-keys';
import { clearTenantCache } from '@/lib/domain/tenant/clear-tenant-cache';
import type { CreateCompanyInput, DataScope, TenantCompany } from '@factume/types/tenant';

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

    const stored = localStorage.getItem(`${ACTIVE_COMPANY_KEY}:${user.id}`);
    setActiveCompanyId(stored);
    setHydrated(true);
  }, [user?.id]);

  useEffect(() => {
    if (!hydrated || companies.length === 0) return;

    const isValid = activeCompanyId && companies.some((c) => c.id === activeCompanyId);
    if (!isValid) {
      const first = companies[0]?.id ?? null;
      setActiveCompanyId(first);
      if (user?.id && first) {
        localStorage.setItem(`${ACTIVE_COMPANY_KEY}:${user.id}`, first);
      }
    }
  }, [hydrated, companies, activeCompanyId, user?.id]);

  const activeCompany = useMemo(
    () => companies.find((c) => c.id === activeCompanyId) ?? null,
    [companies, activeCompanyId],
  );

  const scope = useMemo<DataScope | null>(() => {
    if (!user?.id || !activeCompanyId) return null;
    return { userId: user.id, companyId: activeCompanyId };
  }, [user?.id, activeCompanyId]);

  const switchCompany = useCallback(
    async (companyId: string) => {
      if (!user?.id || companyId === activeCompanyId) return;
      setIsSwitching(true);
      try {
        clearTenantCache(queryClient);
        setActiveCompanyId(companyId);
        localStorage.setItem(`${ACTIVE_COMPANY_KEY}:${user.id}`, companyId);
      } finally {
        setIsSwitching(false);
      }
    },
    [user?.id, activeCompanyId, queryClient],
  );

  const createNewCompany = useCallback(
    async (input: CreateCompanyInput) => {
      if (!user?.id) throw new Error('Utilisateur non connecté.');
      await assertPlanLimit('companies');
      const companyId = await createCompany(input);
      await queryClient.invalidateQueries({ queryKey: companiesQueryKeys.list(user.id) });
      await switchCompany(companyId);
      return companyId;
    },
    [user?.id, queryClient, switchCompany],
  );

  const loading = authLoading || !hydrated || companiesQuery.isLoading;

  const value = useMemo(
    () => ({
      companies,
      activeCompany,
      companyId: activeCompanyId,
      scope,
      loading,
      isSwitching,
      switchCompany,
      createNewCompany,
    }),
    [
      companies,
      activeCompany,
      activeCompanyId,
      scope,
      loading,
      isSwitching,
      switchCompany,
      createNewCompany,
    ],
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany doit être utilisé dans CompanyProvider.');
  }
  return context;
}

export function useTenant() {
  const { scope, loading, isSwitching, activeCompany, companies, switchCompany } = useCompany();
  return { scope, loading, isSwitching, activeCompany, companies, switchCompany };
}
