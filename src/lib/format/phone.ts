export function formatFrenchPhoneInput(value: string): string {
  const trimmed = value.trimStart();
  // Numéro étranger (+32…, 0032…) : gardé tel quel, chiffres et espaces seulement.
  if (trimmed.startsWith('+') || trimmed.startsWith('00')) {
    const international = trimmed.replace(/^00/, '+');
    return `+${international.slice(1).replace(/[^\d ]/g, '').replace(/\s+/g, ' ').slice(0, 20)}`;
  }

  const digits = value.replace(/\D/g, '').slice(0, 10);
  const parts: string[] = [];

  for (let index = 0; index < digits.length; index += 2) {
    parts.push(digits.slice(index, index + 2));
  }

  return parts.join(' ').trim();
}

export function normalizeFrenchPhone(value: string): string {
  return value.replace(/\s/g, '');
}

export function isValidFrenchPhone(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed) {
    return true;
  }

  const normalized = normalizeFrenchPhone(trimmed);

  if (normalized.startsWith('+33')) {
    return /^\+33[1-9]\d{8}$/.test(normalized);
  }

  // Numéro étranger au format international (+32, +44, 0032…).
  const international = normalized.replace(/^00/, '+').replace(/[.\-()]/g, '');
  if (international.startsWith('+')) {
    return /^\+[1-9]\d{6,14}$/.test(international);
  }

  return /^0[1-9]\d{8}$/.test(normalized);
}

export function formatFrenchPhoneDisplay(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  const digits = value.replace(/\D/g, '');

  if (digits.length === 0) {
    return null;
  }

  if (digits.startsWith('33') && digits.length === 11) {
    return formatFrenchPhoneInput(`0${digits.slice(2)}`);
  }

  return formatFrenchPhoneInput(digits.startsWith('0') ? digits : digits.slice(0, 10));
}
