import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { feedback } from '@/constants/theme/interaction';
import { duration } from '@/constants/theme/motion';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { elevation } from '@/constants/theme/surfaces';
import { type } from '@/constants/theme/type-roles';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { GENERIC_ERROR_MESSAGE } from '@/lib/errors/messages';
import { triggerFeedbackHaptic } from '@/lib/haptics';

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
      const dismissMs =
        type === 'success' ? feedback.success.autoDismissMs : feedback.error.autoDismissMs;
      void triggerFeedbackHaptic(type);
      setToast({ id: Date.now(), type, message });

      timeoutRef.current = setTimeout(() => {
        setToast(null);
        timeoutRef.current = null;
      }, dismissMs);
    },
    [clearToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showSuccess: (message) => {
        const trimmed = message.trim();
        showToast('success', trimmed || 'Action réussie');
      },
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
          entering={FadeInDown.duration(duration.fast).springify()}
          exiting={FadeOutUp.duration(duration.fast)}
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
              size={20}
              tintColor={toast.type === 'success' ? colors.success : colors.error}
              type="hierarchical"
            />
            <Text
              accessibilityLiveRegion="polite"
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
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      ...elevation[3],
    },
    success: {
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.success,
    },
    error: {
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.error,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    message: {
      ...type.secondary,
      fontWeight: '600',
      flex: 1,
    },
    successMessage: {
      color: colors.text,
    },
    errorMessage: {
      color: colors.text,
    },
  }));
}
