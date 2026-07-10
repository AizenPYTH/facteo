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

    SplashScreen.hideAsync()
      .then(() => {
        console.log('Splash hidden');
      })
      .catch((error: unknown) => {
      hasHiddenSplash.current = false;
      console.warn('Failed to hide splash screen:', error);
    });
  }, [loading]);

  return null;
}
