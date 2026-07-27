import { Redirect, Stack, type Href } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthLoadingScreen } from '@/components/auth/auth-loading-screen';
import { useAuth } from '@/hooks/use-auth';
import { ForcedSchemeColorsProvider } from '@/providers/colors-provider';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user) {
    return <Redirect href={'/' as Href} />;
  }

  return (
    <ForcedSchemeColorsProvider scheme="dark">
      <Stack screenOptions={{ animation: 'fade', headerShown: false }} />
      <AnimatedSplashOverlay />
    </ForcedSchemeColorsProvider>
  );
}
