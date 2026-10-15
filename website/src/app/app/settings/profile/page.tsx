'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { CompanyProfileForm } from '@/components/app/company-profile-form';
import { LoadingState } from '@/components/app/ui';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
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
  const { activeCompany } = useTenant();
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

  const profileValues = mapProfileToFormValues(
    profileQuery.data ?? null,
    user?.user_metadata ?? {},
    user?.email,
  );
  // Ce qui a été saisi dans le profil entreprise (SIREN/SIRET, adresse, TVA…)
  // complète tout seul les champs vides du profil : rien à ressaisir.
  const fromCompany: Partial<CompanyProfileFormValues> = activeCompany
    ? {
        companyName: activeCompany.name,
        email: activeCompany.email ?? '',
        phone: activeCompany.phone ?? '',
        address: activeCompany.address ?? '',
        postalCode: activeCompany.postalCode ?? '',
        city: activeCompany.city ?? '',
        country: activeCompany.country ?? '',
        siret: activeCompany.siret ?? '',
        vatNumber: activeCompany.vatNumber ?? '',
        iban: activeCompany.iban ?? '',
        bic: activeCompany.bic ?? '',
        paymentMethods: activeCompany.paymentMethods,
      }
    : {};
  const defaults = { ...profileValues };
  for (const [key, companyValue] of Object.entries(fromCompany) as [
    keyof CompanyProfileFormValues,
    CompanyProfileFormValues[keyof CompanyProfileFormValues],
  ][]) {
    const current = defaults[key];
    const isEmpty = Array.isArray(current) ? current.length === 0 : !String(current ?? '').trim();
    const hasCompanyValue = Array.isArray(companyValue)
      ? companyValue.length > 0
      : Boolean(String(companyValue ?? '').trim());
    // Le pays par défaut (« France ») ne masque pas celui de l'entreprise.
    if ((isEmpty || (key === 'country' && !profileQuery.data?.country)) && hasCompanyValue) {
      (defaults as Record<string, unknown>)[key] = companyValue;
    }
  }

  return (
    <div className="mx-auto max-w-[720px] p-5 sm:p-6">
      <CompanyProfileForm
        defaultValues={defaults}
        key={activeCompany?.id ?? 'none'}
        onSubmit={async (values) => {
          await mutation.mutateAsync(values);
        }}
        showPersonalFields
      />
    </div>
  );
}
