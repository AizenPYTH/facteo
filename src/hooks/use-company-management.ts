import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import {
  createCompany,
  deleteCompany,
  updateCompanyName,
} from '@/lib/supabase/companies';
import { companiesQueryKeys } from '@/lib/supabase/query-keys';
import type { CreateCompanyInput } from '@/types/tenant';

export function useCompanyManagement() {
  const { user } = useAuth();
  const { companies, switchCompany, companyId } = useTenant();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const createMutation = useMutation({
    mutationFn: (input: CreateCompanyInput) => createCompany(input),
    onSuccess: async (newCompanyId) => {
      await queryClient.invalidateQueries({ queryKey: companiesQueryKeys.all });
      await switchCompany(newCompanyId);
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ companyId: id, name }: { companyId: string; name: string }) =>
      updateCompanyName(id, name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companiesQueryKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (targetCompanyId: string) => {
      if (companies.length <= 1) {
        throw new Error('Vous devez conserver au moins une entreprise.');
      }

      await deleteCompany(targetCompanyId);

      if (targetCompanyId === companyId) {
        const fallback = companies.find((company) => company.id !== targetCompanyId);
        if (fallback) {
          await switchCompany(fallback.id);
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companiesQueryKeys.all });
    },
  });

  return {
    createCompany: createMutation,
    renameCompany: renameMutation,
    deleteCompany: deleteMutation,
    userId,
  };
}
