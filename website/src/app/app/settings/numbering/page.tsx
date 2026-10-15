'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { SettingsNumberingForm } from '@/components/app/company-profile-form';
import { LoadingState } from '@/components/app/ui';
import { useSettings } from '@/hooks/use-settings';
import { updateSettings } from '@/lib/supabase/settings';
import { settingsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { useTenant } from '@/providers/company-provider';
import { useToast } from '@/providers/toast-provider';
import { toUserFacingError } from '@/lib/errors/messages';
import type { SettingsFormValues } from '@/types/settings';

export default function NumberingSettingsPage() {
  const { scope, activeCompany } = useTenant();
  const { settings, formValues, loading } = useSettings();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const mutation = useMutation({
    mutationFn: (values: SettingsFormValues) => updateSettings(requireScope(scope), values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.all });
      showSuccess(`Numérotation de ${activeCompany?.name?.trim() || 'l’entreprise'} enregistrée.`);
    },
    onError: (error) => showError(toUserFacingError(error.message)),
  });

  if (loading) {
    return <LoadingState message="Chargement des paramètres…" />;
  }

  return (
    <div className="mx-auto max-w-[720px] p-5 sm:p-6">
      {/* Une entreprise par formulaire : changer d'entreprise recharge ses propres réglages. */}
      <SettingsNumberingForm
        companyName={activeCompany?.name}
        defaultValues={formValues}
        key={`${scope?.companyId ?? 'none'}-${settings?.updatedAt ?? ''}`}
        onSubmit={async (values) => {
          await mutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
