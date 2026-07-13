import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { setIsDeveloperModeEnabledState } from '@/lib/dev/dev-state';
import { DEV_MODE_ENABLED_STORAGE_KEY } from '@/lib/dev/dev-storage-keys';

type DeveloperModeContextValue = {
  isReady: boolean;
  isEnabled: boolean;
  enableDeveloperMode: () => Promise<void>;
  disableDeveloperMode: () => Promise<void>;
};

const DeveloperModeContext = createContext<DeveloperModeContextValue | undefined>(undefined);

export function DeveloperModeProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadDeveloperMode() {
      try {
        const stored = await AsyncStorage.getItem(DEV_MODE_ENABLED_STORAGE_KEY);
        const enabled = stored === 'true';

        if (mounted) {
          setIsEnabled(enabled);
          setIsDeveloperModeEnabledState(enabled);
        }
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    }

    void loadDeveloperMode();

    return () => {
      mounted = false;
    };
  }, []);

  const enableDeveloperMode = useCallback(async () => {
    setIsEnabled(true);
    setIsDeveloperModeEnabledState(true);
    await AsyncStorage.setItem(DEV_MODE_ENABLED_STORAGE_KEY, 'true');
  }, []);

  const disableDeveloperMode = useCallback(async () => {
    setIsEnabled(false);
    setIsDeveloperModeEnabledState(false);
    await AsyncStorage.removeItem(DEV_MODE_ENABLED_STORAGE_KEY);
  }, []);

  const value = useMemo<DeveloperModeContextValue>(
    () => ({
      isReady,
      isEnabled,
      enableDeveloperMode,
      disableDeveloperMode,
    }),
    [isReady, isEnabled, enableDeveloperMode, disableDeveloperMode],
  );

  return (
    <DeveloperModeContext.Provider value={value}>{children}</DeveloperModeContext.Provider>
  );
}

export function useDeveloperMode(): DeveloperModeContextValue {
  const context = useContext(DeveloperModeContext);

  if (!context) {
    throw new Error('useDeveloperMode must be used within a DeveloperModeProvider');
  }

  return context;
}
