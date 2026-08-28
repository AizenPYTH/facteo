import { Redirect, Stack, type Href } from 'expo-router';
import { View } from 'react-native';

import { AuthShell } from '@/components/auth/auth-shell';
import { LoadingView } from '@/components/ui/loading-view';
import { useAuth } from '@/hooks/use-auth';
import { ForcedSchemeColorsProvider } from '@/providers/colors-provider';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (user) {
    return <Redirect href={'/' as Href} />;
  }

  return (
    <ForcedSchemeColorsProvider scheme="dark">
      <AuthShell>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 48 }}>
            <LoadingView message="Chargement…" size="small" />
          </View>
        ) : (
          <Stack
            screenOptions={{
              animation: 'none',
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
        )}
      </AuthShell>
    </ForcedSchemeColorsProvider>
  );
}
