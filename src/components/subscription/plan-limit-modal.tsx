import { router, type Href } from 'expo-router';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type PlanLimitModalProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * DESIGN §5.10 : chaque limite Premium renvoie vers l'écran d'offre complet
 * (`settings/premium`) plutôt que de lancer un paiement depuis la modale —
 * ceci évite aussi tout appel Stripe hors de l'écran dédié sur iOS (§1).
 */
export function PlanLimitModal({ visible, onClose }: PlanLimitModalProps) {
  const styles = useStyles();

  function handleViewOffer() {
    onClose();
    router.push('/settings/premium' as Href);
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.dialog}>
          <Text style={styles.title}>Limite atteinte</Text>
          <Text style={styles.description}>
            Vous avez atteint la limite de votre offre actuelle. Passez à INVEQ Premium pour
            continuer.
          </Text>

          <View style={styles.actions}>
            <Button onPress={handleViewOffer} title="Voir l’offre Premium" />
            <Button onPress={onClose} title="Fermer" variant="tertiary" />
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
