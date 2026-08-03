/**
 * Client identity rule for INVEQ V1:
 * - company alone → allowed
 * - firstName + lastName (no company) → allowed
 * - company + person → allowed
 * - neither → rejected
 */
export function hasValidClientIdentity(input: {
  company?: string | null;
  lastName?: string | null;
  firstName?: string | null;
}): boolean {
  const company = (input.company ?? '').trim();
  const lastName = (input.lastName ?? '').trim();
  const firstName = (input.firstName ?? '').trim();

  if (company.length > 0) {
    return true;
  }

  return lastName.length > 0 && firstName.length > 0;
}

export const CLIENT_IDENTITY_ERROR =
  'Renseignez une entreprise, ou un nom et un prénom.';

export const CLIENT_IDENTITY_HINT =
  'Particulier : nom + prénom. Société ou indépendant : entreprise (le contact est optionnel).';
