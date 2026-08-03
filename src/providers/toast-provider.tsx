import { SymbolView } from 'expo-symbols';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Pressable } from 'react-native';
import Animated, { FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { iconSize } from '@/constants/theme/design-system';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { GENERIC_ERROR_MESSAGE } from '@/lib/errors/messages';
import { fadeInUp } from '@/lib/motion/presets';

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
  // Strip a manually-included checkmark from call sites written before the
  // toast grew its own status icon, to avoid a doubled "✓ ✓ Saved" message.
  return trimmed.replace(/^✓\s*/, '') || 'Action réussie';
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
          entering={fadeInUp()}
          exiting={FadeOutUp.duration(180)}
          style={[
            styles.container,
            { top: insets.top + spacing.sm },
            toast.type === 'success' ? styles.success : styles.error,
          ]}>
          <Pressable
            accessibilityHint="Appuyer pour masquer"
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            onPress={clearToast}
            style={styles.row}>
            <SymbolView
              name={
                toast.type === 'success'
                  ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
                  : { ios: 'exclamationmark.circle.fill', android: 'error', web: 'error' }
              }
              size={iconSize.md}
              tintColor={toast.type === 'success' ? colors.success : colors.error}
            />
            <Animated.Text
              style={[
                styles.message,
                toast.type === 'success' ? styles.successMessage : styles.errorMessage,
              ]}>
              {toast.message}
            </Animated.Text>
          </Pressable>
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
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadows.floating,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
    flex: 1,
  },
  successMessage: {
    color: colors.success,
  },
  errorMessage: {
    color: colors.error,
  },
}));
}
