import { Redirect, Stack, type Href } from 'expo-router';

import { AuthLoadingScreen } from '@/components/auth/auth-loading-screen';
import { TenantSwitchingOverlay } from '@/components/tenant/tenant-switching-overlay';
import { DesktopShell } from '@/components/web/desktop/desktop-shell';
import { useAuth } from '@/hooks/use-auth';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { isDesktop, isTablet } = useBreakpoint();
  usePushNotifications();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Redirect href={'/login' as Href} />;
  }

  const useDesktopShell = isDesktop || isTablet;

  const navigation = (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="settings"
          options={{
            animation: useDesktopShell ? 'fade' : 'slide_from_right',
            presentation: useDesktopShell ? 'card' : 'card',
          }}
        />
        <Stack.Screen
          name="company"
          options={{
            animation: useDesktopShell ? 'fade' : 'slide_from_right',
            presentation: 'card',
          }}
        />
      </Stack>
      <TenantSwitchingOverlay />
    </>
  );

  if (useDesktopShell) {
    return <DesktopShell>{navigation}</DesktopShell>;
  }

  return navigation;
}
