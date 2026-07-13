import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type CancelInvoiceModalProps = {
  invoiceNumber: string;
  visible: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CancelInvoiceModal({
  invoiceNumber,
  visible,
  loading = false,
  onCancel,
  onConfirm,
}: CancelInvoiceModalProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <Pressable accessibilityRole="button" onPress={onCancel} style={styles.overlay}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.card}>
          <Text style={styles.title}>Annuler la facture ?</Text>
          <Text style={styles.message}>
            La facture {invoiceNumber} sera marquée comme annulée. Cette action est irréversible.
          </Text>
          <View style={styles.actions}>
            <Button onPress={onCancel} title="Retour" variant="ghost" />
            <Button
              loading={loading}
              onPress={onConfirm}
              style={styles.confirmButton}
              title="Annuler la facture"
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
  confirmButton: {
    backgroundColor: colors.error,
  },
}));
}
