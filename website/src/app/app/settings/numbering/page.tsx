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

/** Même formule que le composer (`reserve_next_*_number` sans requête supplémentaire). */
function forecastNumber(prefix: string | null | undefined, next: number | string, fallback: string) {
  return `${(prefix ?? '').trim() || fallback}-${new Date().getUTCFullYear()}-${String(next).padStart(6, '0')}`;
}

export default function NumberingSettingsPage() {
  const { scope } = useTenant();
  const { settings, formValues, loading } = useSettings();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const mutation = useMutation({
    mutationFn: (values: SettingsFormValues) => updateSettings(requireScope(scope), values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.all });
      showSuccess('Paramètres de numérotation enregistrés.');
    },
    onError: (error) => showError(toUserFacingError(error.message)),
  });

  if (loading) {
    return <LoadingState message="Chargement des paramètres…" />;
  }

  const nextQuote = forecastNumber(
    settings?.quotePrefix ?? formValues.quotePrefix,
    settings?.nextQuoteNumber ?? formValues.nextQuoteNumber,
    'DEV',
  );
  const nextInvoice = forecastNumber(
    settings?.invoicePrefix ?? formValues.invoicePrefix,
    settings?.nextInvoiceNumber ?? formValues.nextInvoiceNumber,
    'FAC',
  );

  return (
    <div className="mx-auto max-w-[720px] p-5 sm:p-6">
      <p className="mb-4 text-[13px] text-app-muted">
        Prochain devis : <span className="app-num font-semibold text-app-text">{nextQuote}</span>
        {' · '}
        Prochaine facture : <span className="app-num font-semibold text-app-text">{nextInvoice}</span>
      </p>
      <SettingsNumberingForm
        defaultValues={formValues}
        onSubmit={async (values) => {
          await mutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
