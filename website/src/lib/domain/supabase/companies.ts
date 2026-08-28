import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import type { CompanyProfileFormValues, UpdateCompanyProfileInput } from '@/types/company-profile';
import { createEmptyCompanyProfileFormValues } from '@/types/company-profile';
import type { CreateCompanyInput, TenantCompany } from '@/types/tenant';
import { normalizePaymentMethods } from '@/types/payment-methods';

export const COMPANY_COLUMNS =
  'id, name, email, phone, address, postal_code, city, country, legal_form, share_capital, rcs_city, siren, siret, vat_number, iban, bic, payment_methods, logo_url, signature_url, created_at, updated_at' as const;

type CompanyRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  legal_form: string | null;
  share_capital: string | null;
  rcs_city: string | null;
  siren: string | null;
  siret: string | null;
  vat_number: string | null;
  iban: string | null;
  bic: string | null;
  payment_methods: unknown;
  logo_url: string | null;
  signature_url: string | null;
  created_at: string;
  updated_at: string;
};

type CompanyMemberRow = {
  role: string;
  companies: CompanyRow;
};

function toNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function mapCompanyRow(row: CompanyRow, role: string): TenantCompany {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    postalCode: row.postal_code,
    city: row.city,
    country: row.country,
    legalForm: row.legal_form,
    shareCapital: row.share_capital,
    rcsCity: row.rcs_city,
    siren: row.siren,
    siret: row.siret,
    vatNumber: row.vat_number,
    iban: row.iban,
    bic: row.bic,
    paymentMethods: normalizePaymentMethods(row.payment_methods),
    logoUrl: row.logo_url,
    signatureUrl: row.signature_url,
    role: role as TenantCompany['role'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCompanyToFormValues(
  company: TenantCompany | null,
  profileFirstName = '',
  profileLastName = '',
  authEmail?: string | null,
): CompanyProfileFormValues {
  const defaults = createEmptyCompanyProfileFormValues();

  if (!company) {
    return {
      ...defaults,
      firstName: profileFirstName,
      lastName: profileLastName,
      email: authEmail ?? defaults.email,
    };
  }

  return {
    companyName: company.name,
    firstName: profileFirstName,
    lastName: profileLastName,
    email: company.email ?? authEmail ?? '',
    phone: company.phone ?? '',
    address: company.address ?? '',
    postalCode: company.postalCode ?? '',
    city: company.city ?? '',
    country: company.country ?? defaults.country,
    legalForm: company.legalForm ?? '',
    shareCapital: company.shareCapital ?? '',
    rcsCity: company.rcsCity ?? '',
    siren: company.siren ?? '',
    siret: company.siret ?? '',
    vatNumber: company.vatNumber ?? '',
    iban: company.iban ?? '',
    bic: company.bic ?? '',
    paymentMethods: company.paymentMethods,
  };
}

export async function fetchUserCompanies(userId: string): Promise<TenantCompany[]> {
  const { data: memberships, error: membersError } = await supabase
    .from('company_members')
    .select('role, company_id')
    .eq('user_id', userId);

  if (membersError) {
    logSupabaseError('fetchUserCompanies', membersError);
    return [];
  }

  const rows = memberships ?? [];
  if (rows.length === 0) {
    return [];
  }

  const companyIds = rows.map((row) => row.company_id);
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select(COMPANY_COLUMNS)
    .in('id', companyIds);

  if (companiesError) {
    logSupabaseError('fetchUserCompanies', companiesError);
    return [];
  }

  const roleByCompanyId = new Map(rows.map((row) => [row.company_id, row.role]));

  return (companies as CompanyRow[] | null)?.map((company) =>
    mapCompanyRow(company, roleByCompanyId.get(company.id) ?? 'member'),
  ) ?? [];
}

export async function fetchCompanyById(companyId: string): Promise<TenantCompany | null> {
  const { data, error } = await supabase
    .from('companies')
    .select(COMPANY_COLUMNS)
    .eq('id', companyId)
    .maybeSingle();

  if (error) {
    logSupabaseError('fetchCompanyById', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return mapCompanyRow(data as CompanyRow, 'owner');
}

export async function createCompany(input: CreateCompanyInput): Promise<string> {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error('Le nom de l’entreprise est obligatoire.');
  }

  const { data, error } = await supabase.rpc('create_company_for_user', {
    p_name: trimmedName,
  });

  if (error || typeof data !== 'string') {
    logSupabaseError('createCompany', error ?? new Error('Impossible de créer l’entreprise.'));
    throw error ?? new Error('Impossible de créer l’entreprise.');
  }

  return data;
}

export async function updateCompanyProfile(
  companyId: string,
  input: UpdateCompanyProfileInput,
): Promise<TenantCompany> {
  const siretDigits = input.siret.replace(/\D/g, '');
  const sirenDigits =
    input.siren.replace(/\D/g, '') || (siretDigits.length >= 9 ? siretDigits.slice(0, 9) : '');

  const payload = {
    name: input.companyName.trim(),
    email: input.email.trim(),
    phone: toNullableString(input.phone),
    address: toNullableString(input.address),
    postal_code: toNullableString(input.postalCode),
    city: toNullableString(input.city),
    country: toNullableString(input.country),
    legal_form: toNullableString(input.legalForm),
    share_capital: toNullableString(input.shareCapital),
    rcs_city: toNullableString(input.rcsCity),
    siren: toNullableString(sirenDigits),
    siret: toNullableString(siretDigits),
    vat_number: toNullableString(input.vatNumber.replace(/\s/g, '').toUpperCase()),
    iban: toNullableString(input.iban.replace(/\s/g, '').toUpperCase()),
    bic: toNullableString(input.bic.replace(/\s/g, '').toUpperCase()),
    payment_methods: input.paymentMethods,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('companies')
    .update(payload)
    .eq('id', companyId)
    .select(COMPANY_COLUMNS)
    .single();

  if (error) {
    logSupabaseError('updateCompanyProfile', error);
    throw error;
  }

  return mapCompanyRow(data as CompanyRow, 'owner');
}

export async function updateCompanyName(companyId: string, name: string): Promise<TenantCompany> {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error('Le nom de l’entreprise est obligatoire.');
  }

  const { data, error } = await supabase
    .from('companies')
    .update({ name: trimmedName, updated_at: new Date().toISOString() })
    .eq('id', companyId)
    .select(COMPANY_COLUMNS)
    .single();

  if (error) {
    logSupabaseError('updateCompanyName', error);
    throw error;
  }

  return mapCompanyRow(data as CompanyRow, 'owner');
}

export async function deleteCompany(companyId: string): Promise<void> {
  const { error } = await supabase.from('companies').delete().eq('id', companyId);

  if (error) {
    logSupabaseError('deleteCompany', error);
    throw error;
  }
}

export async function updateCompanyAssetUrl(
  companyId: string,
  field: 'logo_url' | 'signature_url',
  url: string | null,
): Promise<void> {
  const payload =
    field === 'logo_url'
      ? { logo_url: url, updated_at: new Date().toISOString() }
      : { signature_url: url, updated_at: new Date().toISOString() };

  const { error } = await supabase.from('companies').update(payload).eq('id', companyId);

  if (error) {
    logSupabaseError('updateCompanyAssetUrl', error);
    throw error;
  }
}
