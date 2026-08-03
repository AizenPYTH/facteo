/**
 * Stores "Nom, Prénom" in the single `name` column for alphabetical sort by family name.
 * Company-only clients store the company name in `name` (column is NOT NULL).
 */
export function formatClientStoredName(
  lastName: string,
  firstName: string,
  company?: string | null,
): string {
  const last = lastName.trim();
  const first = firstName.trim();
  const companyName = (company ?? '').trim();

  if (last && first) {
    return `${last}, ${first}`;
  }

  if (last) {
    return last;
  }

  if (first) {
    return first;
  }

  return companyName;
}

export function parseClientStoredName(name: string): { lastName: string; firstName: string } {
  const trimmed = name.trim();
  const commaIndex = trimmed.indexOf(', ');

  if (commaIndex === -1) {
    return { lastName: trimmed, firstName: '' };
  }

  return {
    lastName: trimmed.slice(0, commaIndex).trim(),
    firstName: trimmed.slice(commaIndex + 2).trim(),
  };
}

/**
 * Resolves person fields from DB row. When `name` equals `company`, the client is company-only.
 */
export function resolveClientPersonName(row: {
  name: string;
  company?: string | null;
}): { lastName: string; firstName: string } {
  const company = (row.company ?? '').trim();
  const name = row.name.trim();

  if (company && name === company) {
    return { lastName: '', firstName: '' };
  }

  return parseClientStoredName(row.name);
}

export function formatClientFullName(lastName: string, firstName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
}

export function getClientDisplayName(client: {
  lastName: string;
  firstName: string;
  company?: string | null;
}): string {
  const company = client.company?.trim();
  if (company) {
    return company;
  }

  return formatClientFullName(client.lastName, client.firstName) || client.lastName;
}

export function getClientSecondaryLabel(client: {
  lastName: string;
  firstName: string;
  company?: string | null;
}): string | null {
  const company = client.company?.trim();
  if (!company) {
    return null;
  }

  const person = formatClientFullName(client.lastName, client.firstName);
  return person || null;
}
