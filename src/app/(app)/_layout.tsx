import { Redirect, Stack, type Href } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthLoadingScreen } from '@/components/auth/auth-loading-screen';
import { TenantSwitchingOverlay } from '@/components/tenant/tenant-switching-overlay';
import { useAuth } from '@/hooks/use-auth';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { stackScreenOptions } from '@/lib/navigation/screen-options';

export default function AppLayout() {
  const { user, loading } = useAuth();
  usePushNotifications();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Redirect href={'/login' as Href} />;
  }

  return (
    <>
      <AnimatedSplashOverlay />
      {/* Animation, geste de retour et présentation viennent d'un seul jeu
          d'options : chaque pile déclarait les siennes auparavant. */}
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="settings" />
        <Stack.Screen name="company" />
      </Stack>
      <TenantSwitchingOverlay />
    </>
  );
}
