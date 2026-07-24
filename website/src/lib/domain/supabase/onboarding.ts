import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import { updateCompanyAssetUrl } from '@/lib/domain/supabase/companies';
import {
  COMPANY_ASSETS_BUCKET,
  getPublicStorageUrl,
} from '@/lib/domain/supabase/storage';
import type { OnboardingFormValues } from '@/lib/domain/validations/onboarding';
import type { DataScope } from '@/types/tenant';

/** Noms techniques / placeholders à ne jamais afficher comme valeur saisie. */
const UNSET_COMPANY_NAMES = new Set(['', 'mon entreprise', 'nouvelle entreprise']);

export function isUnsetCompanyName(name: string | null | undefined): boolean {
  return UNSET_COMPANY_NAMES.has((name ?? '').trim().toLowerCase());
}

function toNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function uploadCompanyLogoFile(
  companyId: string,
  file: File,
): Promise<string> {
  const mimeType = file.type || 'image/png';
  const extension = mimeType.includes('png')
    ? 'png'
    : mimeType.includes('webp')
      ? 'webp'
      : mimeType.includes('gif')
        ? 'gif'
        : 'jpg';
  const path = `${companyId}/logo-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(COMPANY_ASSETS_BUCKET).upload(path, file, {
    contentType: mimeType,
    upsert: true,
  });

  if (error) {
    logSupabaseError('uploadCompanyLogoFile', error);
    throw error;
  }

  const url = getPublicStorageUrl(path);
  await updateCompanyAssetUrl(companyId, 'logo_url', url);
  return url;
}

export type OnboardingDraft = {
  values: OnboardingFormValues;
  logoUrl: string | null;
  step: number;
};

export async function loadOnboardingDraft(scope: DataScope): Promise<OnboardingDraft> {
  const [{ data: company }, { data: profile }, { data: settings }] = await Promise.all([
    supabase
      .from('companies')
      .select(
        'name, phone, address, postal_code, city, country, siret, vat_number, logo_url',
      )
      .eq('id', scope.companyId)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('activity_type, phone, company_name, onboarding_step')
      .eq('id', scope.userId)
      .maybeSingle(),
    supabase
      .from('settings')
      .select('currency')
      .eq('company_id', scope.companyId)
      .maybeSingle(),
  ]);

  const savedStep = Math.min(3, Math.max(0, profile?.onboarding_step ?? 0));
  const companyNameRaw = company?.name ?? profile?.company_name ?? '';
  const companyName = isUnsetCompanyName(companyNameRaw) ? '' : companyNameRaw.trim();
  const activityType = (profile?.activity_type as OnboardingFormValues['activityType']) || '';

  return {
    step: savedStep > 0 ? Math.min(savedStep, 3) : 1,
    values: {
      companyName,
      activityType,
      phone: company?.phone ?? profile?.phone ?? '',
      address: company?.address ?? '',
      city: company?.city ?? '',
      postalCode: company?.postal_code ?? '',
      country: savedStep >= 2 ? (company?.country ?? '') : '',
      currency: savedStep >= 3 ? (settings?.currency ?? '') : '',
      vatNumber: company?.vat_number ?? '',
      siret: company?.siret ?? '',
    },
    logoUrl: company?.logo_url ?? null,
  };
}

/** Persiste une étape sans marquer l'onboarding comme terminé. */
export async function saveOnboardingDraft(
  scope: DataScope,
  values: OnboardingFormValues,
  step: 1 | 2 | 3,
  logoFile?: File | null,
): Promise<void> {
  if (step === 1) {
    const { error: companyError } = await supabase
      .from('companies')
      .update({
        name: values.companyName.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', scope.companyId);

    if (companyError) {
      logSupabaseError('saveOnboardingDraft.step1.company', companyError);
      throw companyError;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        activity_type: values.activityType || null,
        company_name: values.companyName.trim() || null,
        onboarding_step: 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scope.userId);

    if (profileError) {
      logSupabaseError('saveOnboardingDraft.step1.profile', profileError);
      throw profileError;
    }
    return;
  }

  if (step === 2) {
    const { error: companyError } = await supabase
      .from('companies')
      .update({
        phone: toNullableString(values.phone),
        address: toNullableString(values.address),
        postal_code: toNullableString(values.postalCode),
        city: toNullableString(values.city),
        country: toNullableString(values.country),
        updated_at: new Date().toISOString(),
      })
      .eq('id', scope.companyId);

    if (companyError) {
      logSupabaseError('saveOnboardingDraft.step2.company', companyError);
      throw companyError;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        phone: toNullableString(values.phone),
        onboarding_step: 2,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scope.userId);

    if (profileError) {
      logSupabaseError('saveOnboardingDraft.step2.profile', profileError);
      throw profileError;
    }
    return;
  }

  const sirenOrSiret = toNullableString(values.siret.replace(/\s/g, ''));

  const { error: companyError } = await supabase
    .from('companies')
    .update({
      siret: sirenOrSiret,
      vat_number: toNullableString(values.vatNumber.replace(/\s/g, '').toUpperCase()),
      updated_at: new Date().toISOString(),
    })
    .eq('id', scope.companyId);

  if (companyError) {
    logSupabaseError('saveOnboardingDraft.step3.company', companyError);
    throw companyError;
  }

  if (values.currency.trim()) {
    const { error: settingsError } = await supabase
      .from('settings')
      .update({
        currency: values.currency.trim().toUpperCase(),
        updated_at: new Date().toISOString(),
      })
      .eq('company_id', scope.companyId);

    if (settingsError) {
      logSupabaseError('saveOnboardingDraft.step3.settings', settingsError);
      throw settingsError;
    }
  }

  if (logoFile) {
    await uploadCompanyLogoFile(scope.companyId, logoFile);
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      onboarding_step: 3,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scope.userId);

  if (profileError) {
    logSupabaseError('saveOnboardingDraft.step3.profile', profileError);
    throw profileError;
  }
}

export async function completeOnboarding(
  scope: DataScope,
  values: OnboardingFormValues,
  logoFile?: File | null,
): Promise<void> {
  await saveOnboardingDraft(scope, values, 1);
  await saveOnboardingDraft(scope, values, 2);
  await saveOnboardingDraft(scope, values, 3, logoFile);

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      activity_type: values.activityType,
      company_name: values.companyName.trim(),
      phone: toNullableString(values.phone),
      onboarding_completed: true,
      onboarding_step: 3,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scope.userId);

  if (profileError) {
    logSupabaseError('completeOnboarding.profile', profileError);
    throw profileError;
  }
}
