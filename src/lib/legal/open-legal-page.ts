import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { MARKETING_HELP_URLS, MARKETING_LEGAL_URLS } from '@/constants/marketing/site';

export type LegalPagePath = keyof typeof MARKETING_LEGAL_URLS;
export type HelpPagePath = keyof typeof MARKETING_HELP_URLS;

async function openExternalUrl(url: string): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  await Linking.openURL(url);
}

export async function openLegalPage(path: LegalPagePath): Promise<void> {
  await openExternalUrl(MARKETING_LEGAL_URLS[path]);
}

export async function openHelpPage(path: HelpPagePath): Promise<void> {
  await openExternalUrl(MARKETING_HELP_URLS[path]);
}
