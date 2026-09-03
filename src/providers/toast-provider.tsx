import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { SymbolView } from 'expo-symbols';
import { Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { duration } from '@/constants/theme/motion';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { GENERIC_ERROR_MESSAGE } from '@/lib/errors/messages';
import { triggerErrorHaptic, triggerSuccessHaptic } from '@/lib/haptics';

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
  // La coche est désormais portée par l'icône : la garder dans le texte la
  // ferait lire deux fois par VoiceOver.
  return message.trim() || 'Action réussie';
}

export function ToastProvider({ children }: PropsWithChildren) {
  const styles = useStyles();
  const colors = useColors();
  const [toast, setToast] = useState<ToastState | null>(null);
  const reduceMotion = useReduceMotion();
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

      // Retour haptique sur l'issue de l'action — c'est le seul endroit de
      // l'app où l'on vibre pour un résultat, pas pour un appui.
      void (type === 'success' ? triggerSuccessHaptic() : triggerErrorHaptic());

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
          entering={reduceMotion ? undefined : FadeInUp.duration(duration.base)}
          exiting={reduceMotion ? undefined : FadeOutUp.duration(duration.fast)}
          style={[
            styles.container,
            { top: insets.top + spacing.sm },
            toast.type === 'success' ? styles.success : styles.error,
          ]}>
          <View style={styles.row}>
            <SymbolView
              name={
                toast.type === 'success'
                  ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
                  : { ios: 'exclamationmark.circle.fill', android: 'error', web: 'error' }
              }
              size={18}
              tintColor={toast.type === 'success' ? colors.success : colors.error}
              type="hierarchical"
            />
            <Text
              accessibilityLiveRegion="polite"
              accessibilityRole={toast.type === 'error' ? 'alert' : 'text'}
              maxFontSizeMultiplier={1.5}
              style={[
                styles.message,
                toast.type === 'success' ? styles.successMessage : styles.errorMessage,
              ]}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
