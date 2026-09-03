import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from '@/components/app-error-boundary';
import { SplashScreenController } from '@/components/splash-screen-controller';
import { AuthProvider } from '@/providers/auth-provider';
import { ColorsProvider } from '@/providers/colors-provider';
import { CompanyProvider } from '@/providers/company-provider';
import { QueryProvider } from '@/providers/query-provider';
import { SubscriptionProvider } from '@/providers/subscription-provider';
import { ThemePreferenceProvider, useThemePreference } from '@/providers/theme-preference-provider';
import { ToastProvider } from '@/providers/toast-provider';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Can fail if called more than once during fast refresh.
});

function RootNavigation() {
  const { colorScheme } = useThemePreference();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="legal" />
        <Stack.Screen name="cookies" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="auth" />
      </Stack>
    </ThemeProvider>
  );
}

/**
 * ColorsProvider enveloppe désormais tout l'arbre applicatif, et non plus
 * seulement la navigation. Il était monté sous ToastProvider : les toasts
 * tombaient donc sur la palette claire par défaut du contexte et restaient
 * blancs en mode sombre.
 */
export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <KeyboardProvider>
          <QueryProvider>
            <AuthProvider>
              <CompanyProvider>
                <ThemePreferenceProvider>
                  <ColorsProvider>
                    <SplashScreenController />
                    <ToastProvider>
                      <SubscriptionProvider>
                        <RootNavigation />
                      </SubscriptionProvider>
                    </ToastProvider>
                  </ColorsProvider>
                </ThemePreferenceProvider>
              </CompanyProvider>
            </AuthProvider>
          </QueryProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}
