import { Redirect, Stack, type Href } from 'expo-router';

import { AuthLoadingScreen } from '@/components/auth/auth-loading-screen';
import { TenantSwitchingOverlay } from '@/components/tenant/tenant-switching-overlay';
import { useAuth } from '@/hooks/use-auth';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export default function AppLayout() {
  const { user, loading } = useAuth();
  usePushNotifications();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Redirect href={'/login' as Href} />;
  }

  // No AnimatedSplashOverlay here: keep cold-start path identical to last stable TF (#41).
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="settings"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="company"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
          }}
        />
      </Stack>
      <TenantSwitchingOverlay />
    </>
  );
}
