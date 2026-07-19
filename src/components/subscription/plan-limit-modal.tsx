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
  const { startCheckout, subscribe, isConfigured } = usePremiumCheckout();
  const { showError, showSuccess } = useToast();

  async function handleUpgrade() {
    if (!isConfigured) {
      showError('Stripe n’est pas encore configuré. Contactez le support.');
      return;
    }

    try {
      onClose();
      const completed = await startCheckout();

      if (completed) {
        showSuccess('FACTEO Premium est activé.');
      }
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.dialog}>
          <Text style={styles.title}>Limite atteinte</Text>
          <Text style={styles.description}>
            Vous avez atteint la limite de votre offre actuelle. Passez à une offre supérieure pour
            continuer.
          </Text>

          <View style={styles.actions}>
            <Button
              loading={subscribe.isPending}
              onPress={() => {
                void handleUpgrade();
              }}
              title="Voir les offres"
            />
            <Button onPress={onClose} title="Fermer" variant="ghost" />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Impossible d’ouvrir le paiement Stripe.';
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
