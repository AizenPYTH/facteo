import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SplashScreenController } from '@/components/splash-screen-controller';
import { AuthProvider } from '@/providers/auth-provider';
import { CompanyProvider } from '@/providers/company-provider';
import { ColorsProvider } from '@/providers/colors-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ThemePreferenceProvider, useThemePreference } from '@/providers/theme-preference-provider';
import { SubscriptionProvider } from '@/providers/subscription-provider';
import { ToastProvider } from '@/providers/toast-provider';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Can fail if called more than once during fast refresh.
});

function RootNavigation() {
  const { colorScheme } = useThemePreference();

  return (
    <ColorsProvider>
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
        </Stack>
      </ThemeProvider>
    </ColorsProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <QueryProvider>
            <AuthProvider>
              <CompanyProvider>
                <ThemePreferenceProvider>
                    <SplashScreenController />
                    <ToastProvider>
                      <SubscriptionProvider>
                        <BottomSheetModalProvider>
                          <RootNavigation />
                        </BottomSheetModalProvider>
                      </SubscriptionProvider>
                    </ToastProvider>
                </ThemePreferenceProvider>
              </CompanyProvider>
            </AuthProvider>
          </QueryProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
