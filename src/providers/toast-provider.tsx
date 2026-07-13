import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { GENERIC_ERROR_MESSAGE } from '@/lib/errors/messages';

type ToastType = 'success' | 'error';

type ToastState = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION_MS = 3200;

function formatSuccessMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return '✓ Action réussie';
  }

  return trimmed.startsWith('✓') ? trimmed : `✓ ${trimmed}`;
}

export function ToastProvider({ children }: PropsWithChildren) {
  const styles = useStyles();
  const colors = useColors();
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const clearToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setToast(null);
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string) => {
      clearToast();
      setToast({ id: Date.now(), type, message });

      timeoutRef.current = setTimeout(() => {
        setToast(null);
        timeoutRef.current = null;
      }, TOAST_DURATION_MS);
    },
    [clearToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showSuccess: (message) => showToast('success', formatSuccessMessage(message)),
      showError: (message) =>
        showToast('error', message.trim() || GENERIC_ERROR_MESSAGE),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          entering={FadeInUp.duration(220)}
          exiting={FadeOutUp.duration(180)}
          style={[
            styles.container,
            { top: insets.top + spacing.sm },
            toast.type === 'success' ? styles.success : styles.error,
          ]}>
          <Animated.Text
            accessibilityLiveRegion="polite"
            style={[
              styles.message,
              toast.type === 'success' ? styles.successMessage : styles.errorMessage,
            ]}>
            {toast.message}
          </Animated.Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const styles = useStyles();
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

function useStyles() {
  return useThemedStyles((colors) => ({
  container: {
    position: 'absolute',
    left: spacing.screenPaddingHorizontal,
    right: spacing.screenPaddingHorizontal,
    zIndex: 9999,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
  },
  success: {
    backgroundColor: colors.successSubtle,
    borderColor: colors.success,
  },
  error: {
    backgroundColor: colors.errorSubtle,
    borderColor: colors.error,
  },
  message: {
    ...typography.subheadlineMedium,
    textAlign: 'center',
  },
  successMessage: {
    color: colors.success,
  },
  errorMessage: {
    color: colors.error,
  },
}));
}
