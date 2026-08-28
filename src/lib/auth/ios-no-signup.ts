import { Platform } from 'react-native';

import { isAccountCreationPathOrUrl } from '@/lib/auth/account-creation-paths';

export { isAccountCreationPathOrUrl };

/**
 * App Store Guideline 3.1.1 — no account creation from the iOS binary.
 * Registration stays on www.inveq.fr/register (website only).
 */
export function isIosAccountCreationDisabled(): boolean {
  return Platform.OS === 'ios';
}

export function assertIosSignupAllowed(): Error | null {
  if (!isIosAccountCreationDisabled()) {
    return null;
  }
  return new Error(
    'La création de compte n’est pas disponible dans l’application iOS. Créez votre compte sur www.inveq.fr.',
  );
}
