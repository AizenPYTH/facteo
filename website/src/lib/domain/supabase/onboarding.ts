import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import { updateCompanyAssetUrl } from '@/lib/domain/supabase/companies';
import {
  COMPANY_ASSETS_BUCKET,
  getPublicStorageUrl,
} from '@/lib/domain/supabase/storage';
import type { OnboardingFormValues } from '@/lib/domain/validations/onboarding';
import type { DataScope } from '@/types/tenant';

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

export async function completeOnboarding(
  scope: DataScope,
  values: OnboardingFormValues,
  logoFile?: File | null,
): Promise<void> {
  const sirenOrSiret = toNullableString(values.siret.replace(/\s/g, ''));

  const { error: companyError } = await supabase
    .from('companies')
    .update({
      name: values.companyName.trim(),
      phone: toNullableString(values.phone),
      address: toNullableString(values.address),
      postal_code: toNullableString(values.postalCode),
      city: toNullableString(values.city),
      country: toNullableString(values.country) ?? 'France',
      siret: sirenOrSiret,
      vat_number: toNullableString(values.vatNumber.replace(/\s/g, '').toUpperCase()),
      updated_at: new Date().toISOString(),
    })
    .eq('id', scope.companyId);

  if (companyError) {
    logSupabaseError('completeOnboarding.company', companyError);
    throw companyError;
  }

  const { error: settingsError } = await supabase
    .from('settings')
    .update({
      currency: values.currency.trim().toUpperCase(),
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', scope.companyId);

  if (settingsError) {
    logSupabaseError('completeOnboarding.settings', settingsError);
    throw settingsError;
  }

  if (logoFile) {
    await uploadCompanyLogoFile(scope.companyId, logoFile);
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      activity_type: values.activityType,
      company_name: values.companyName.trim(),
      phone: toNullableString(values.phone),
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scope.userId);

  if (profileError) {
    logSupabaseError('completeOnboarding.profile', profileError);
    throw profileError;
  }
}
