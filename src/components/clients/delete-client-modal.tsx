import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type DeleteClientModalProps = {
  visible: boolean;
  clientName?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteClientModal({
  visible,
  clientName,
  loading = false,
  onCancel,
  onConfirm,
}: DeleteClientModalProps) {
  const styles = useStyles();
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <Pressable onPress={onCancel} style={styles.overlay}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.dialog}>
          <Text maxFontSizeMultiplier={1.4} style={styles.title}>
            Archiver le client ?
          </Text>
          <Text maxFontSizeMultiplier={1.5} style={styles.description}>
            {clientName
              ? `${clientName} sera archivé. Vous pourrez le restaurer plus tard.`
              : 'Le client sera archivé. Vous pourrez le restaurer plus tard.'}
          </Text>

          <View style={styles.actions}>
            <Button onPress={onCancel} title="Annuler" variant="tertiary" />
            <Button
              loading={loading}
              onPress={onConfirm}
              title="Archiver"
              variant="destructive"
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
      backgroundColor: colors.overlay,
      justifyContent: 'center' as const,
      paddingHorizontal: spacing.lg,
    },
    dialog: {
      backgroundColor: colors.surface,
      borderRadius: radius.sheet,
      padding: spacing.lg,
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      ...typography.title3,
      color: colors.text,
    },
    description: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
  }));
}
