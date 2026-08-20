import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/** Gestion des abonnements Apple (iOS) — jamais de lien tarifs web. */
export const APPLE_MANAGE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

/**
 * Ouvre la gestion d’abonnement conforme App Store (Réglages Apple).
 * Sur iOS, n’ouvre jamais inveq.fr/tarifs (Guideline 3.1.1).
 */
export async function openManageSubscription(): Promise<void> {
  if (Platform.OS !== 'ios') {
    throw new Error('La gestion d’abonnement App Store est disponible uniquement sur iOS.');
  }

  const supported = await Linking.canOpenURL(APPLE_MANAGE_SUBSCRIPTIONS_URL);
  if (!supported) {
    throw new Error('Impossible d’ouvrir la gestion des abonnements Apple.');
  }

  await Linking.openURL(APPLE_MANAGE_SUBSCRIPTIONS_URL);
}
