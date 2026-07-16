import { useEffect } from 'react';
import { Platform } from 'react-native';

import { MARKETING_LEGAL_URLS } from '@/constants/marketing/site';

export default function PrivacyRedirect() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.replace(MARKETING_LEGAL_URLS.privacy);
    }
  }, []);

  return null;
}
