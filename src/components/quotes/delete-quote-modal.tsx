import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type DeleteQuoteModalProps = {
  quoteNumber: string;
  visible: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteQuoteModal({
  quoteNumber,
  visible,
  loading = false,
  onCancel,
  onConfirm,
}: DeleteQuoteModalProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <Pressable accessibilityRole="button" onPress={onCancel} style={styles.overlay}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.card}>
          <Text style={styles.title}>Supprimer le devis ?</Text>
          <Text style={styles.message}>
            Le devis {quoteNumber} sera définitivement supprimé. Cette action est irréversible.
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
  deleteButton: {
    backgroundColor: colors.error,
  },
}));
}
