/**
 * Stores "Nom, Prénom" in the single `name` column for alphabetical sort by family name.
 */
export function formatClientStoredName(lastName: string, firstName: string): string {
  const last = lastName.trim();
  const first = firstName.trim();

  if (!last) {
    return first;
  }

  if (!first) {
    return last;
  }

  return `${last}, ${first}`;
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
