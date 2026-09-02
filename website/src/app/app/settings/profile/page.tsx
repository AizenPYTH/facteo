'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { AppTopBar } from '@/components/app/app-shell';
import { CompanyProfileForm } from '@/components/app/company-profile-form';
import { LoadingState, Panel } from '@/components/app/ui';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { toUserFacingError } from '@/lib/errors/messages';
import {
  fetchUserProfile,
  mapProfileToFormValues,
  upsertCompanyProfile,
} from '@/lib/domain/supabase/profiles';
import type { CompanyProfileFormValues } from '@/types/company-profile';

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const profileQuery = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => fetchUserProfile(user!.id),
    enabled: Boolean(user?.id),
  });

  const mutation = useMutation({
    mutationFn: (values: CompanyProfileFormValues) =>
      upsertCompanyProfile(user!.id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      router.refresh();
      showSuccess('Profil enregistré.');
    },
    onError: (error) => showError(toUserFacingError(error.message)),
  });

  if (profileQuery.isLoading) {
    return <LoadingState message="Chargement du profil…" />;
  }

  const defaults = mapProfileToFormValues(
    profileQuery.data ?? null,
    user?.user_metadata ?? {},
    user?.email,
  );

  return (
    <>
      <AppTopBar subtitle="Informations personnelles de votre compte" title="Profil">
        <Link className="text-sm font-medium text-primary hover:underline" href="/app/settings">
          ← Paramètres
        </Link>
      </AppTopBar>
      <div className="flex-1 overflow-y-auto p-6 xl:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <Panel>
            <CompanyProfileForm
              defaultValues={defaults}
              onSubmit={async (values) => {
                await mutation.mutateAsync(values);
              }}
              showPersonalFields
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
