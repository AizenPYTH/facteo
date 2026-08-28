/**
 * Identité client (règle métier unique).
 *
 * Autorisé :
 * - entreprise seule
 * - nom + prénom
 * - entreprise + nom + prénom
 *
 * Refusé :
 * - aucun des deux
 * - prénom seul / nom seul (sans entreprise)
 */

export type ClientIdentityInput = {
  company?: string | null;
  lastName?: string | null;
  firstName?: string | null;
};

export const CLIENT_IDENTITY_ERROR =
  'Indiquez une entreprise, ou un nom et un prénom.';

export function hasClientIdentity(input: ClientIdentityInput): boolean {
  const company = input.company?.trim() ?? '';
  const lastName = input.lastName?.trim() ?? '';
  const firstName = input.firstName?.trim() ?? '';

  if (company.length > 0) {
    return true;
  }

  return lastName.length > 0 && firstName.length > 0;
}

export function getClientIdentityError(input: ClientIdentityInput): string | null {
  return hasClientIdentity(input) ? null : CLIENT_IDENTITY_ERROR;
}
