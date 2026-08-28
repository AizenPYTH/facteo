import { Redirect, Stack, type Href } from 'expo-router';

import { AuthLoadingScreen } from '@/components/auth/auth-loading-screen';
import { useAuth } from '@/hooks/use-auth';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user) {
    return <Redirect href={'/' as Href} />;
  }

  // register.tsx redirects to login on iOS (Guideline 3.1.1).
  return <Stack screenOptions={{ animation: 'fade', headerShown: false }} />;
}
