import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { usePremiumCheckout } from '@/hooks/use-premium-checkout';
import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useToast } from '@/providers/toast-provider';

export type PlanLimitModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function PlanLimitModal({ visible, onClose }: PlanLimitModalProps) {
  const styles = useStyles();
  const { startCheckout, subscribe } = usePremiumCheckout();
  const { showError, showSuccess } = useToast();

  async function handleUpgrade() {
    try {
      onClose();
      await startCheckout();
      showSuccess('Consultez les offres sur inveq.fr');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Impossible d’ouvrir le site.');
    }
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.dialog}>
          <Text style={styles.title}>Limite atteinte</Text>
          <Text style={styles.description}>
            Vous avez atteint la limite de votre offre actuelle. Consultez Basique, Standard ou Pro
            sur inveq.fr pour continuer.
          </Text>

          <View style={styles.actions}>
            <Button
              loading={subscribe.isPending}
              onPress={() => {
                void handleUpgrade();
              }}
              title="Voir les offres sur le web"
            />
            <Button onPress={onClose} title="Fermer" variant="ghost" />
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
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    dialog: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: {
      ...typography.title3,
      color: colors.text,
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
  }));
}
