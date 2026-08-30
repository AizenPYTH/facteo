import { ActivityIndicator, Modal, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type ProductAnalysisLoadingModalProps = {
  visible: boolean;
  progress: number;
  onCancel?: () => void;
};

export function ProductAnalysisLoadingModal({
  visible,
  progress,
  onCancel,
}: ProductAnalysisLoadingModalProps) {
  const styles = useStyles();
  const colors = useColors();
  const percent = Math.round(Math.min(100, Math.max(5, progress * 100)));

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.title}>Analyse du produit…</Text>
          <Text style={styles.subtitle}>L’IA identifie le nom, le prix et les détails utiles.</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{percent}%</Text>

          {onCancel ? (
            <Button onPress={onCancel} title="Annuler" variant="tertiary" />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.overlay,
      padding: spacing.lg,
    },
    card: {
      width: '100%',
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
    progressTrack: {
      width: '100%',
      height: 8,
      marginTop: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.backgroundSecondary,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    progressLabel: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
    },
  }));
}
