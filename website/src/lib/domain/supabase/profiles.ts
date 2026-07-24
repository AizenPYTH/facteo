import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import { debugProfileTrace } from '@/lib/supabase/profile-debug';
import { ensureUserProfileExists } from '@/lib/supabase/storage';
import type {
  CompanyProfile,
  CompanyProfileFormValues,
  UpdateCompanyProfileInput,
} from '@/types/company-profile';
import { createEmptyCompanyProfileFormValues } from '@/types/company-profile';
import type { Profile, ProfileInsert } from '@/types/database';
import { normalizePaymentMethods } from '@/types/payment-methods';

export const PROFILE_COLUMNS =
  'id, first_name, last_name, company_name, email, phone, address, postal_code, city, country, siret, vat_number, iban, bic, payment_methods, logo_url, signature_url, avatar_url, activity_type, onboarding_completed, created_at, updated_at' as const;

type UserMetadata = Record<string, unknown>;

function readMetadataString(metadata: UserMetadata, key: string): string | undefined {
  const value = metadata[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function toNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function mapProfileToCompanyProfile(row: Profile): CompanyProfile {
  return {
    id: row.id,
    companyName: row.company_name ?? '',
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    address: row.address ?? '',
    postalCode: row.postal_code ?? '',
    city: row.city ?? '',
    country: row.country ?? '',
    siret: row.siret ?? '',
    vatNumber: row.vat_number ?? '',
    iban: row.iban ?? '',
    bic: row.bic ?? '',
    paymentMethods: normalizePaymentMethods(row.payment_methods),
    logoUrl: row.logo_url,
    signatureUrl: row.signature_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProfileToFormValues(
  profile: Profile | null,
  metadata: UserMetadata,
  authEmail?: string | null,
): CompanyProfileFormValues {
  const defaults = createEmptyCompanyProfileFormValues();

  if (!profile) {
    return {
      ...defaults,
      companyName: readMetadataString(metadata, 'company_name') ?? defaults.companyName,
      firstName: readMetadataString(metadata, 'first_name') ?? defaults.firstName,
      lastName: readMetadataString(metadata, 'last_name') ?? defaults.lastName,
      email: authEmail ?? defaults.email,
      country: defaults.country,
    };
  }

  return {
    companyName: profile.company_name ?? '',
    firstName: profile.first_name ?? '',
    lastName: profile.last_name ?? '',
    email: profile.email ?? authEmail ?? '',
    phone: profile.phone ?? '',
    address: profile.address ?? '',
    postalCode: profile.postal_code ?? '',
    city: profile.city ?? '',
    country: profile.country ?? defaults.country,
    siret: profile.siret ?? '',
    vatNumber: profile.vat_number ?? '',
    iban: profile.iban ?? '',
    bic: profile.bic ?? '',
    paymentMethods: normalizePaymentMethods(profile.payment_methods),
  };
}

function mapFormValuesToProfileInsert(
  userId: string,
  input: UpdateCompanyProfileInput,
): ProfileInsert {
  return {
    id: userId,
    company_name: input.companyName.trim(),
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    email: input.email.trim(),
    phone: toNullableString(input.phone),
    address: toNullableString(input.address),
    postal_code: toNullableString(input.postalCode),
    city: toNullableString(input.city),
    country: toNullableString(input.country),
    siret: toNullableString(input.siret.replace(/\s/g, '')),
    vat_number: toNullableString(input.vatNumber.replace(/\s/g, '').toUpperCase()),
    iban: toNullableString(input.iban.replace(/\s/g, '').toUpperCase()),
    bic: toNullableString(input.bic.replace(/\s/g, '').toUpperCase()),
    payment_methods: input.paymentMethods,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchCompanyProfile(
  userId: string,
  metadata: UserMetadata = {},
  authEmail?: string | null,
): Promise<CompanyProfileFormValues> {
  const { data: authData } = await supabase.auth.getUser();
  const authUserId = authData.user?.id ?? null;

  await ensureUserProfileExists();

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  debugProfileTrace('fetchCompanyProfile', {
    authUserId,
    passedUserId: userId,
    idsMatch: authUserId === userId,
    profileFound: Boolean(data),
    profileId: data?.id ?? null,
    logoUrl: data?.logo_url ?? null,
    signatureUrl: data?.signature_url ?? null,
    error: error?.message ?? null,
  });

  if (error) {
    logSupabaseError('fetchCompanyProfile', error);
    return mapProfileToFormValues(null, metadata, authEmail);
  }

  return mapProfileToFormValues(data as Profile | null, metadata, authEmail);
}

export async function upsertCompanyProfile(
  userId: string,
  input: UpdateCompanyProfileInput,
): Promise<CompanyProfile> {
  await ensureUserProfileExists();

  const payload = mapFormValuesToProfileInsert(userId, input);

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    logSupabaseError('upsertCompanyProfile', error);
    throw error;
  }

  return mapProfileToCompanyProfile(data as Profile);
}

export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    logSupabaseError('fetchUserProfile', error);
    return null;
  }

  return data as Profile | null;
}
