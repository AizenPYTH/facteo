'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { CompanyAssetsPanel } from '@/components/app/company-assets-panel';
import { CompanyProfileForm } from '@/components/app/company-profile-form';
import { LoadingState } from '@/components/app/ui';
import { mapCompanyToFormValues, updateCompanyProfile } from '@/lib/domain/supabase/companies';
import { companiesQueryKeys } from '@/lib/domain/supabase/query-keys';
import { useTenant } from '@/providers/company-provider';
import { useToast } from '@/providers/toast-provider';
import { toUserFacingError } from '@/lib/errors/messages';
import type { CompanyProfileFormValues } from '@/types/company-profile';

export default function CompanySettingsPage() {
  const { activeCompany, loading } = useTenant();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const mutation = useMutation({
    mutationFn: (values: CompanyProfileFormValues) =>
      updateCompanyProfile(activeCompany!.id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: companiesQueryKeys.all });
      showSuccess('Profil entreprise enregistré.');
    },
    onError: (error) => showError(toUserFacingError(error.message)),
  });

  if (loading || !activeCompany) {
    return <LoadingState message="Chargement de l’entreprise…" />;
  }

  const defaults = mapCompanyToFormValues(activeCompany);

  return (
    <div className="mx-auto max-w-[720px] p-5 sm:p-6">
      <CompanyAssetsPanel
        companyId={activeCompany.id}
        logoUrl={activeCompany.logoUrl}
        onUpdated={() => {
          void queryClient.invalidateQueries({ queryKey: companiesQueryKeys.all });
        }}
        signatureUrl={activeCompany.signatureUrl}
      />
      <CompanyProfileForm
        defaultValues={defaults}
        onSubmit={async (values) => {
          await mutation.mutateAsync(values);
        }}
        showPersonalFields={false}
      />
    </div>
  );
}
