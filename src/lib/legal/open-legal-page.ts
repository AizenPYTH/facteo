import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';

import {
  MARKETING_CONTACT,
  MARKETING_HELP_URLS,
  MARKETING_LEGAL_URLS,
  MARKETING_SITE_URL,
} from '@/constants/marketing/site';

export type LegalPagePath = keyof typeof MARKETING_LEGAL_URLS;
export type HelpPagePath = keyof typeof MARKETING_HELP_URLS;

/**
 * Ouvre une URL externe dans le navigateur système (Safari sur iOS).
 * Exigence App Store : les documents légaux doivent s’ouvrir hors de l’app.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Lien indisponible', `Impossible d’ouvrir :\n${url}`);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('Lien indisponible', `Impossible d’ouvrir :\n${url}`);
  }
}

export async function openLegalPage(path: LegalPagePath): Promise<void> {
  await openExternalUrl(MARKETING_LEGAL_URLS[path]);
}

export async function openHelpPage(path: HelpPagePath): Promise<void> {
  // Guideline 3.1.1 : depuis iOS, éviter les pages marketing qui mènent aux tarifs.
  if (Platform.OS === 'ios') {
    const subject =
      path === 'guide'
        ? 'INVEQ — Guide d’utilisation'
        : path === 'contact'
          ? 'INVEQ — Contact'
          : 'INVEQ — Support';
    await openSupportEmail(subject);
    return;
  }

  await openExternalUrl(MARKETING_HELP_URLS[path]);
}

export async function openMarketingSite(): Promise<void> {
  // Guideline 3.1.1 : éviter d’ouvrir le site marketing depuis iOS (page tarifs accessible).
  if (Platform.OS === 'ios') {
    await openSupportEmail('INVEQ — Support');
    return;
  }

  await openExternalUrl(MARKETING_SITE_URL);
}

export async function openContactEmail(subject?: string): Promise<void> {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  await openExternalUrl(`mailto:${MARKETING_CONTACT.email}${query}`);
}

export async function openSupportEmail(subject?: string): Promise<void> {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  await openExternalUrl(`mailto:${MARKETING_CONTACT.support}${query}`);
}
