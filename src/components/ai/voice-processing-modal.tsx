import { ActivityIndicator, Modal, Text, View } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type VoiceProcessingModalProps = {
  visible: boolean;
};

export function VoiceProcessingModal({ visible }: VoiceProcessingModalProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.title}>Analyse de votre demande…</Text>
          <Text style={styles.subtitle}>
            FACTEO transcrit votre voix puis prépare le devis ou la facture.
          </Text>
        </View>
      </View>
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
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.xl,
    },
    title: {
      ...typography.title3,
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  }));
}
