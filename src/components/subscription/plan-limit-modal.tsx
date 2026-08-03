import { router, type Href } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { PREMIUM_MARKETING } from '@/constants/premium-marketing';
import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type PlanLimitModalProps = {
  visible: boolean;
  onClose: () => void;
};

/** Paywall limite / feature : bouton Débloquer Premium vers la page d’achat. */
export function PlanLimitModal({ visible, onClose }: PlanLimitModalProps) {
  const styles = useStyles();

  function handleUnlock() {
    onClose();
    router.push('/settings/premium' as Href);
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.dialog}>
          <Text style={styles.title}>Fonctionnalité Premium</Text>
          <Text style={styles.description}>
            Cette action nécessite INVEQ Premium ({PREMIUM_MARKETING.priceDisplay}). Débloquez toutes
            les fonctionnalités sans limite.
          </Text>

          <View style={styles.actions}>
            <Button elevated onPress={handleUnlock} title={PREMIUM_MARKETING.unlockCta} />
            <Button onPress={onClose} title="Plus tard" variant="ghost" />
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
      lineHeight: 21,
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
  }));
}
