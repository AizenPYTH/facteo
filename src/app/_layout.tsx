import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { SplashScreenController } from '@/components/splash-screen-controller';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ToastProvider } from '@/providers/toast-provider';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Can fail if called more than once during fast refresh.
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    console.log('RootLayout mounted');
  }, []);

  return (
    <QueryProvider>
      <AuthProvider>
        <SplashScreenController />
        <ToastProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
          </ThemeProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
