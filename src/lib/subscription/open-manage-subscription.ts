import * as Linking from 'expo-linking';

import { MARKETING_SITE_URL } from '@/constants/marketing/site';

export const MANAGE_SUBSCRIPTION_URL = `${MARKETING_SITE_URL}/tarifs`;

/** Ouvre la page tarifs web (achat / gestion hors App Store). */
export async function openManageSubscriptionOnWeb(): Promise<void> {
  const supported = await Linking.canOpenURL(MANAGE_SUBSCRIPTION_URL);
  if (!supported) {
    throw new Error('Impossible d’ouvrir le site INVEQ.');
  }
  await Linking.openURL(MANAGE_SUBSCRIPTION_URL);
}
