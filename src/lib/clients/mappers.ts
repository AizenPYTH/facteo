import type { ClientFormValues } from '@/types/client';
import type { ClientInsert, ClientUpdate } from '@/types/database';

function toNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeDigits(value: string): string | null {
  const digits = value.replace(/\s/g, '');
  return digits.length > 0 ? digits : null;
}

export function mapFormValuesToClientInsert(
  userId: string,
  input: ClientFormValues,
): ClientInsert {
  return {
    user_id: userId,
    name: input.contactName.trim(),
    company: toNullableString(input.company),
    email: toNullableString(input.email),
    phone: toNullableString(input.phone),
    address: toNullableString(input.address),
    postal_code: toNullableString(input.postalCode),
    city: toNullableString(input.city),
    country: toNullableString(input.country),
    siren: normalizeDigits(input.siren),
    siret: normalizeDigits(input.siret),
    vat_number: toNullableString(input.vatNumber.replace(/\s/g, '').toUpperCase()),
    notes: toNullableString(input.notes),
    updated_at: new Date().toISOString(),
  };
}

export function mapFormValuesToClientUpdate(input: ClientFormValues): ClientUpdate {
  return {
    name: input.contactName.trim(),
    company: toNullableString(input.company),
    email: toNullableString(input.email),
    phone: toNullableString(input.phone),
    address: toNullableString(input.address),
    postal_code: toNullableString(input.postalCode),
    city: toNullableString(input.city),
    country: toNullableString(input.country),
    siren: normalizeDigits(input.siren),
    siret: normalizeDigits(input.siret),
    vat_number: toNullableString(input.vatNumber.replace(/\s/g, '').toUpperCase()),
    notes: toNullableString(input.notes),
    updated_at: new Date().toISOString(),
  };
}
