/** Calcule le numéro de TVA intracommunautaire français à partir du SIREN. */
export function computeFrenchVatNumberFromSiren(siren: string): string | null {
  if (!/^\d{9}$/.test(siren)) {
    return null;
  }

  const sirenValue = Number.parseInt(siren, 10);
  const key = (12 + 3 * (sirenValue % 97)) % 97;

  return `FR${String(key).padStart(2, '0')}${siren}`;
}
