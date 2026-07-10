import { Redirect, type Href } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthLoadingScreen } from '@/components/auth/auth-loading-screen';
import AppTabs from '@/components/app-tabs';
import { useAuth } from '@/hooks/use-auth';

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Redirect href={'/login' as Href} />;
  }

  return (
    <>
      <AnimatedSplashOverlay />
      <AppTabs />
    </>
  );
}
