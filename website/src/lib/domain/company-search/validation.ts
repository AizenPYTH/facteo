import { z } from 'zod';

export function normalizeRegistrationDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function luhnCheck(digits: string): boolean {
  let sum = 0;
  const parity = digits.length % 2;

  for (let index = 0; index < digits.length; index += 1) {
    let digit = Number.parseInt(digits[index] ?? '0', 10);

    if (index % 2 === parity) {
      digit *= 2;

      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
  }

  return sum % 10 === 0;
}

export function isValidSiren(value: string): boolean {
  const digits = normalizeRegistrationDigits(value);
  return digits.length === 9 && luhnCheck(digits);
}

export function isValidSiret(value: string): boolean {
  const digits = normalizeRegistrationDigits(value);
  return digits.length === 14 && luhnCheck(digits);
}

export function isValidRegistrationNumber(value: string): boolean {
  const digits = normalizeRegistrationDigits(value);
  return isValidSiren(digits) || isValidSiret(digits);
}

/**
 * Détermine le numéro à interroger : SIRET (14 chiffres) prioritaire sur SIREN (9 chiffres).
 */
export function getLookupRegistrationNumber(siren: string, siret: string): string | null {
  const cleanSiret = normalizeRegistrationDigits(siret);
  const cleanSiren = normalizeRegistrationDigits(siren);

  if (cleanSiret.length === 14) {
    return cleanSiret;
  }

  if (cleanSiren.length === 9 && cleanSiret.length < 14) {
    return cleanSiren;
  }

  return null;
}

export function isReadyForLookup(siren: string, siret: string): boolean {
  const candidate = getLookupRegistrationNumber(siren, siret);

  if (!candidate) {
    return false;
  }

  return isValidRegistrationNumber(candidate);
}

export const registrationDigitsSchema = z
  .string()
  .transform(normalizeRegistrationDigits)
  .refine((digits) => digits.length === 9 || digits.length === 14, {
    message: 'Le numéro doit contenir 9 (SIREN) ou 14 (SIRET) chiffres.',
  })
  .refine((digits) => luhnCheck(digits), {
    message: 'Numéro SIREN ou SIRET invalide.',
  });
