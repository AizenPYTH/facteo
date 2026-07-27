import { Redirect, Stack, type Href } from 'expo-router';

import { AuthLoadingScreen } from '@/components/auth/auth-loading-screen';
import { AuthShell } from '@/components/auth/auth-shell';
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
      <AuthShell>
        <Stack
          screenOptions={{
            animation: 'none',
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </AuthShell>
    </ForcedSchemeColorsProvider>
  );
}
