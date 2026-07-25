import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type BatchConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  loading?: boolean;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function BatchConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  loading = false,
  destructive = false,
  onCancel,
  onConfirm,
}: BatchConfirmModalProps) {
  const styles = useStyles();

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <Pressable accessibilityRole="button" onPress={onCancel} style={styles.overlay}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button onPress={onCancel} title="Annuler" variant="ghost" />
            <Button
              loading={loading}
              onPress={onConfirm}
              style={destructive ? styles.destructiveButton : undefined}
              title={confirmLabel}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: {
      ...typography.title3,
      color: colors.text,
    },
    message: {
      ...typography.body,
      color: colors.textSecondary,
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    destructiveButton: {
      backgroundColor: colors.error,
    },
  }));
}
