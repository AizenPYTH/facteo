'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AppTopBar } from '@/components/app/app-shell';
import { CompanyProfileForm } from '@/components/app/company-profile-form';
import { LoadingState, Panel } from '@/components/app/ui';
import { mapCompanyToFormValues, updateCompanyProfile } from '@/lib/domain/supabase/companies';
import { companiesQueryKeys } from '@/lib/domain/supabase/query-keys';
import { useTenant } from '@/providers/company-provider';
import type { CompanyProfileFormValues } from '@/types/company-profile';

export default function CompanySettingsPage() {
  const { activeCompany, loading } = useTenant();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: CompanyProfileFormValues) =>
      updateCompanyProfile(activeCompany!.id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: companiesQueryKeys.all });
    },
  });

  if (loading || !activeCompany) {
    return <LoadingState message="Chargement de l’entreprise…" />;
  }

  const defaults = mapCompanyToFormValues(activeCompany);

  return (
    <>
      <AppTopBar subtitle={activeCompany.name} title="Profil entreprise">
        <Link className="text-sm font-medium text-primary hover:underline" href="/app/settings">
          ← Paramètres
        </Link>
      </AppTopBar>
      <div className="flex-1 overflow-y-auto p-6 xl:p-8">
        <div className="mx-auto max-w-3xl">
          <Panel>
            <CompanyProfileForm
              defaultValues={defaults}
              onSubmit={async (values) => {
                await mutation.mutateAsync(values);
              }}
              showPersonalFields={false}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
