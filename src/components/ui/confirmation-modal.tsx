import { BlurView } from 'expo-blur';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { motion } from '@/constants/theme/design-system';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemePreference } from '@/providers/theme-preference-provider';

export type ConfirmationModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for destructive actions (delete, cancel, remove). Default true. */
  destructive?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * INVEQ's single confirmation dialog — replaces the near-identical
 * DeleteClientModal / DeleteQuoteModal / CancelInvoiceModal (and the raw
 * Alert.alert confirmations scattered around settings/company). One
 * component means the spring-in motion, blur backdrop, and button layout
 * are guaranteed consistent everywhere the app asks "are you sure?".
 */
export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  destructive = true,
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmationModalProps) {
  const styles = useStyles();
  const colors = useColors();
  const { colorScheme } = useThemePreference();

  return (
    <Modal animationType="none" onRequestClose={onCancel} transparent visible={visible}>
      <Animated.View entering={FadeIn.duration(motion.fast)} exiting={FadeOut.duration(motion.fast)} style={StyleSheet.absoluteFill}>
        <Pressable accessibilityLabel="Fermer" onPress={onCancel} style={StyleSheet.absoluteFill}>
          <BlurView
            intensity={28}
            style={StyleSheet.absoluteFill}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
          />
          <View style={[StyleSheet.absoluteFill, styles.scrim]} />
        </Pressable>
      </Animated.View>

      <View pointerEvents="box-none" style={styles.overlay}>
        <Animated.View
          entering={ZoomIn.duration(motion.normal).springify().damping(18).stiffness(260)}
          exiting={FadeOut.duration(motion.fast)}
          style={styles.dialog}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Button onPress={onCancel} style={styles.actionButton} title={cancelLabel} variant="ghost" />
            <Button
              loading={loading}
              onPress={onConfirm}
              style={[styles.actionButton, destructive ? { backgroundColor: colors.error } : null]}
              title={confirmLabel}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    scrim: {
      backgroundColor: colors.scrim,
    },
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    dialog: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: radius.sheet,
      padding: spacing.lg,
      gap: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...shadows.xl,
    },
    title: {
      ...typography.title3,
      color: colors.text,
    },
    message: {
      ...typography.subheadline,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
  }));
}
