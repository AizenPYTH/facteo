'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { CompanyProfileForm } from '@/components/app/company-profile-form';
import { LoadingState } from '@/components/app/ui';
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
    <div className="mx-auto max-w-[720px] p-5 sm:p-6">
      <CompanyProfileForm
        defaultValues={defaults}
        onSubmit={async (values) => {
          await mutation.mutateAsync(values);
        }}
        showPersonalFields
      />
    </div>
  );
}
