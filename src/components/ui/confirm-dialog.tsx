import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { duration } from '@/constants/theme/motion';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { useReduceMotion } from '@/hooks/use-reduce-motion';

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Style d'alerte pour les actions irréversibles. */
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
};

/**
 * Confirmation canonique.
 *
 * Remplace les deux langages qui coexistaient — trois modales maison quasi
 * identiques et sept `Alert.alert` natifs — pour des gestes de même gravité.
 *
 * `accessibilityViewIsModal` piège le focus VoiceOver dans la boîte : l'audit
 * avait relevé que le fond restait focusable dans les modales existantes.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Annuler',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
  testID,
}: ConfirmDialogProps) {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();

  return (
    <Modal animationType="none" onRequestClose={onCancel} transparent visible={visible}>
      <Animated.View
        entering={reduceMotion ? undefined : FadeIn.duration(duration.fast)}
        exiting={reduceMotion ? undefined : FadeOut.duration(duration.fast)}
        style={styles.backdrop}>
        <Pressable
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          onPress={loading ? undefined : onCancel}
          style={styles.backdropPress}
        />

        <Animated.View
          accessibilityViewIsModal
          entering={reduceMotion ? undefined : ZoomIn.duration(duration.base)}
          exiting={reduceMotion ? undefined : ZoomOut.duration(duration.fast)}
          style={styles.dialog}
          testID={testID}>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.title}>
            {title}
          </Text>

          {message ? (
            <Text maxFontSizeMultiplier={1.6} style={styles.message}>
              {message}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Button
              accessibilityLabel={confirmLabel}
              loading={loading}
              onPress={onConfirm}
              style={destructive ? styles.destructive : undefined}
              title={confirmLabel}
            />
            <Button
              accessibilityLabel={cancelLabel}
              disabled={loading}
              onPress={onCancel}
              title={cancelLabel}
              variant="ghost"
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    backdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.overlay,
      paddingHorizontal: spacing.lg,
    },
    backdropPress: {
      ...({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const),
    },
    dialog: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.modal,
      padding: spacing.lg,
      gap: spacing[2],
    },
    title: {
      ...typography.headline,
      color: colors.text,
      textAlign: 'center',
    },
    message: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    actions: {
      gap: spacing[2],
      marginTop: spacing[2],
    },
    destructive: {
      backgroundColor: colors.error,
    },
  }));
