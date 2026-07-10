import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { colors } from '@/constants/theme/colors';
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
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <Pressable onPress={onCancel} style={styles.overlay}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.dialog}>
          <Text style={styles.title}>Supprimer le client ?</Text>
          <Text style={styles.description}>
            {clientName
              ? `Voulez-vous vraiment supprimer ${clientName} ? Cette action est irréversible.`
              : 'Cette action est irréversible.'}
          </Text>

          <View style={styles.actions}>
            <Button onPress={onCancel} title="Annuler" variant="ghost" />
            <Button
              loading={loading}
              onPress={onConfirm}
              style={styles.deleteButton}
              title="Supprimer"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
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
  deleteButton: {
    backgroundColor: colors.error,
  },
});
