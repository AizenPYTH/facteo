import { formatClientStoredName, parseClientStoredName } from '@/lib/clients/name';
import { normalizeFrenchPhone } from '@/lib/format/phone';
import type { ClientFormValues } from '@/types/client';
import type { ClientInsert, ClientUpdate } from '@/types/database';
import type { DataScope } from '@/types/tenant';

function toNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullablePhone(value: string): string | null {
  const normalized = normalizeFrenchPhone(value);
  return normalized.length > 0 ? normalized : null;
}

export function mapFormValuesToClientInsert(
  scope: DataScope,
  input: ClientFormValues,
): ClientInsert {
  return {
    user_id: scope.userId,
    company_id: scope.companyId,
    name: formatClientStoredName(input.lastName, input.firstName),
    company: toNullableString(input.company),
    email: toNullableString(input.email),
    phone: toNullablePhone(input.phone),
    address: toNullableString(input.address),
    postal_code: toNullableString(input.postalCode),
    city: toNullableString(input.city),
    country: toNullableString(input.country),
    siren: toNullableString(input.siren.replace(/\D/g, '')),
    siret: toNullableString(input.siret.replace(/\D/g, '')),
    vat_number: toNullableString(input.vatNumber.replace(/\s/g, '').toUpperCase()),
    notes: toNullableString(input.notes),
    updated_at: new Date().toISOString(),
  };
}

export function mapFormValuesToClientUpdate(input: ClientFormValues): ClientUpdate {
  return {
    name: formatClientStoredName(input.lastName, input.firstName),
    company: toNullableString(input.company),
    email: toNullableString(input.email),
    phone: toNullablePhone(input.phone),
    address: toNullableString(input.address),
    postal_code: toNullableString(input.postalCode),
    city: toNullableString(input.city),
    country: toNullableString(input.country),
    siren: toNullableString(input.siren.replace(/\D/g, '')),
    siret: toNullableString(input.siret.replace(/\D/g, '')),
    vat_number: toNullableString(input.vatNumber.replace(/\s/g, '').toUpperCase()),
    notes: toNullableString(input.notes),
    updated_at: new Date().toISOString(),
  };
}

export { parseClientStoredName };
