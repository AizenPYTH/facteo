'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AppTopBar } from '@/components/app/app-shell';
import { SettingsNumberingForm } from '@/components/app/company-profile-form';
import { LoadingState, Panel } from '@/components/app/ui';
import { useSettings } from '@/hooks/use-settings';
import { updateSettings } from '@/lib/supabase/settings';
import { settingsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { useTenant } from '@/providers/company-provider';
import type { SettingsFormValues } from '@/types/settings';

export default function NumberingSettingsPage() {
  const { scope } = useTenant();
  const { formValues, loading } = useSettings();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: SettingsFormValues) => updateSettings(requireScope(scope), values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.all });
    },
  });

  if (loading) {
    return <LoadingState message="Chargement des paramètres…" />;
  }

  return (
    <>
      <AppTopBar subtitle="Préfixes, numérotation et conditions par défaut" title="Numérotation">
        <Link className="text-sm font-medium text-primary hover:underline" href="/app/settings">
          ← Paramètres
        </Link>
      </AppTopBar>
      <div className="flex-1 overflow-y-auto p-6 xl:p-8">
        <div className="mx-auto max-w-3xl">
          <Panel>
            <SettingsNumberingForm
              defaultValues={formValues}
              onSubmit={async (values) => {
                await mutation.mutateAsync(values);
              }}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
