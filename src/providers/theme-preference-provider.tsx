import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Appearance, Platform, useColorScheme as useSystemColorScheme, type ColorSchemeName } from 'react-native';

import { colors as lightColors, colorsDark } from '@/constants/theme/colors';

export const THEME_PREFERENCE_STORAGE_KEY = 'INVEQ_color_scheme';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  colorScheme: 'light' | 'dark';
  isReady: boolean;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | undefined>(undefined);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: ColorSchemeName,
): 'light' | 'dark' {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }

  return systemScheme === 'dark' ? 'dark' : 'light';
}

function applyNativeColorScheme(preference: ThemePreference): void {
  if (Platform.OS === 'web') {
    return;
  }

  if (preference === 'system') {
    Appearance.setColorScheme(null as unknown as ColorSchemeName);
    return;
  }

  Appearance.setColorScheme(preference);
}

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadPreference() {
      try {
        const stored = await AsyncStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);

        if (mounted && isThemePreference(stored)) {
          setPreferenceState(stored);
          applyNativeColorScheme(stored);
        }
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    }

    void loadPreference();

    return () => {
      mounted = false;
    };
  }, []);

  const setPreference = useCallback(async (nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    applyNativeColorScheme(nextPreference);
    await AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, nextPreference);
  }, []);

  const colorScheme = resolveColorScheme(preference, systemScheme);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const backgroundColor =
      colorScheme === 'dark' ? colorsDark.backgroundGrouped : lightColors.backgroundGrouped;

    void SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [colorScheme]);

  const value = useMemo<ThemePreferenceContextValue>(
    () => ({
      preference,
      colorScheme,
      isReady,
      setPreference,
    }),
    [preference, colorScheme, isReady, setPreference],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>
  );
}

export function useThemePreference(): ThemePreferenceContextValue {
  const context = useContext(ThemePreferenceContext);

  if (!context) {
    throw new Error('useThemePreference must be used within a ThemePreferenceProvider');
  }

  return context;
}
