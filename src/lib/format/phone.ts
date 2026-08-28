/** Normalize phone for validation: keep leading +, strip separators. */
export function normalizePhone(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/** @deprecated Prefer normalizePhone — kept for existing imports. */
export function normalizeFrenchPhone(value: string): string {
  return normalizePhone(value);
}

/**
 * Accepts French national numbers and international E.164-style numbers
 * (e.g. +351 962 003 090). Empty is valid (optional field).
 */
export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed) {
    return true;
  }

  const normalized = normalizePhone(trimmed);

  if (normalized.startsWith('+')) {
    return /^\+[1-9]\d{7,14}$/.test(normalized);
  }

  return /^0[1-9]\d{8}$/.test(normalized);
}

/** @deprecated Prefer isValidPhone */
export function isValidFrenchPhone(value: string): boolean {
  return isValidPhone(value);
}

/**
 * Format as the user types. Preserves international (+…) input;
 * applies French pairing only for national numbers.
 */
export function formatFrenchPhoneInput(value: string): string {
  const trimmedStart = value.trimStart();

  if (trimmedStart.startsWith('+')) {
    let result = '+';
    let digitCount = 0;

    for (let index = 1; index < value.length; index += 1) {
      const char = value[index];
      if (/\d/.test(char)) {
        if (digitCount >= 15) {
          continue;
        }
        result += char;
        digitCount += 1;
      } else if (char === ' ' && result.length > 1 && !result.endsWith(' ')) {
        result += ' ';
      }
    }

    return result;
  }

  const digits = value.replace(/\D/g, '').slice(0, 10);
  const parts: string[] = [];

  for (let index = 0; index < digits.length; index += 2) {
    parts.push(digits.slice(index, index + 2));
  }

  return parts.join(' ').trim();
}

export function formatFrenchPhoneDisplay(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.startsWith('+')) {
    return trimmed.replace(/\s+/g, ' ').trim();
  }

  const digits = value.replace(/\D/g, '');

  if (digits.length === 0) {
    return null;
  }

  if (digits.startsWith('33') && digits.length === 11) {
    return formatFrenchPhoneInput(`0${digits.slice(2)}`);
  }

  if (digits.length > 10) {
    return trimmed;
  }

  return formatFrenchPhoneInput(digits.startsWith('0') ? digits : digits.slice(0, 10));
}

/**
 * FR (75001), PT (2700-337), and other common international postal codes.
 */
export function isValidPostalCode(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed) {
    return true;
  }

  if (/^\d{5}$/.test(trimmed)) {
    return true;
  }

  if (/^\d{4}-\d{3}$/.test(trimmed)) {
    return true;
  }

  return /^[A-Z0-9][A-Z0-9\s-]{1,11}$/i.test(trimmed) && /\d/.test(trimmed);
}
