import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/hooks/use-auth';

/**
 * Hides the native splash screen once auth session restoration completes.
 * Must render inside AuthProvider.
 */
export function SplashScreenController() {
  const { loading } = useAuth();
  const hasHiddenSplash = useRef(false);

  useEffect(() => {
    if (loading || hasHiddenSplash.current) {
      return;
    }

    hasHiddenSplash.current = true;

    SplashScreen.hideAsync().catch(() => {
      hasHiddenSplash.current = false;
    });
  }, [loading]);

  return null;
}
