import { ActivityIndicator, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { triggerImpactHaptic } from '@/lib/haptics';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type WizardActionBarProps = {
  backLabel: string;
  onBack: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
};

export function WizardActionBar({
  backLabel,
  onBack,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryLoading = false,
}: WizardActionBarProps) {
  const styles = useStyles();
  const colors = useColors();
  const isDisabled = primaryDisabled || primaryLoading;

  return (
    <View style={styles.row}>
      <PressableScale
        accessibilityLabel={backLabel}
        accessibilityRole="button"
        onPress={() => {
          void triggerImpactHaptic();
          onBack();
        }}
        style={styles.backButton}>
        <Text maxFontSizeMultiplier={1.3} style={styles.backLabel}>
          {backLabel}
        </Text>
      </PressableScale>

      <PressableScale
        accessibilityLabel={primaryLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: primaryLoading }}
        disabled={isDisabled}
        onPress={() => {
          if (!isDisabled) {
            void triggerImpactHaptic();
            onPrimary();
          }
        }}
        style={[styles.primaryButton, isDisabled && styles.primaryButtonDisabled]}>
        {primaryLoading ? (
          <ActivityIndicator color={colors.onPrimary} size="small" />
        ) : (
          <Text maxFontSizeMultiplier={1.3} style={styles.primaryLabel}>
            {primaryLabel}
          </Text>
        )}
      </PressableScale>
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    backButton: {
      minHeight: 40,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.button,
    },
    backLabel: {
      ...typography.subheadlineMedium,
      color: colors.primary,
    },
    primaryButton: {
      flex: 1,
      minHeight: 40,
      borderRadius: radius.button,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.primary,
    },
    primaryButtonDisabled: {
      opacity: 0.5,
    },
    primaryLabel: {
      ...typography.subheadlineMedium,
      color: colors.onPrimary,
    },
  }));
