import type { Client, ClientFormValues } from '@/types/client';

export type ClientDuplicateMatch = {
  client: Client;
  reasons: string[];
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

function normalizeVat(value: string): string {
  return value.replace(/\s/g, '').toUpperCase();
}

function normalizeSiren(value: string): string {
  return value.replace(/\D/g, '');
}

/** Find likely duplicates among existing clients for the given form values. */
export function findClientDuplicates(
  values: Pick<ClientFormValues, 'email' | 'phone' | 'siren' | 'siret' | 'vatNumber' | 'company'>,
  existing: Client[],
): ClientDuplicateMatch[] {
  const email = normalizeEmail(values.email);
  const phone = normalizePhone(values.phone);
  const siren = normalizeSiren(values.siren || values.siret.slice(0, 9));
  const vat = normalizeVat(values.vatNumber);
  const company = values.company.trim().toLowerCase();

  const matches: ClientDuplicateMatch[] = [];

  for (const client of existing) {
    const reasons: string[] = [];

    if (email && client.email && normalizeEmail(client.email) === email) {
      reasons.push('même e-mail');
    }
    if (phone && client.phone && normalizePhone(client.phone) === phone) {
      reasons.push('même téléphone');
    }
    if (siren && client.siren && normalizeSiren(client.siren) === siren) {
      reasons.push('même SIREN');
    }
    if (siren && client.siret && normalizeSiren(client.siret).startsWith(siren)) {
      reasons.push('même SIREN (SIRET)');
    }
    if (vat && client.vatNumber && normalizeVat(client.vatNumber) === vat) {
      reasons.push('même N° TVA');
    }
    if (
      company.length >= 3 &&
      client.company &&
      client.company.trim().toLowerCase() === company
    ) {
      reasons.push('même société');
    }

    if (reasons.length > 0) {
      matches.push({ client, reasons });
    }
  }

  return matches;
}
