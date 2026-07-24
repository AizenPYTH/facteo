import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type VoicePermissionModalProps = {
  visible: boolean;
  blocked: boolean;
  onRetry: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
};

export function VoicePermissionModal({
  visible,
  blocked,
  onRetry,
  onOpenSettings,
  onClose,
}: VoicePermissionModalProps) {
  const styles = useStyles();

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.card}>
          <Text style={styles.title}>Microphone requis</Text>
          <Text style={styles.subtitle}>
            INVEQ a besoin de votre microphone pour créer un devis ou une facture à la voix.
          </Text>

          <View style={styles.actions}>
            {!blocked ? <Button onPress={onRetry} title="Réessayer" /> : null}
            <Button onPress={onOpenSettings} title="Ouvrir les réglages" variant="ghost" />
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
      justifyContent: 'center',
      padding: spacing.lg,
      backgroundColor: colors.overlay,
    },
    card: {
      borderRadius: radius.modal,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: {
      ...typography.title3,
      color: colors.text,
    },
    subtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    actions: {
      gap: spacing.sm,
    },
  }));
}
