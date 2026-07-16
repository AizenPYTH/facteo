import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { MARKETING_LEGAL_URLS } from '@/constants/marketing/site';

export type LegalPagePath = keyof typeof MARKETING_LEGAL_URLS;

export async function openLegalPage(path: LegalPagePath): Promise<void> {
  const url = MARKETING_LEGAL_URLS[path];

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  await Linking.openURL(url);
}
