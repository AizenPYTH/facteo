import { ActivityIndicator, Pressable, Text, View } from 'react-native';

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
  /** Raison affichée sous le primaire désactivé — DESIGN §5.3 */
  disabledReason?: string;
};

export function WizardActionBar({
  backLabel,
  onBack,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryLoading = false,
  disabledReason,
}: WizardActionBarProps) {
  const styles = useStyles();
  const colors = useColors();
  const isDisabled = primaryDisabled || primaryLoading;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          accessibilityLabel={backLabel}
          accessibilityRole="button"
          onPress={() => {
            void triggerImpactHaptic();
            onBack();
          }}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
          <Text maxFontSizeMultiplier={1.3} style={styles.backLabel}>
            {backLabel}
          </Text>
        </Pressable>

        <Pressable
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
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && !isDisabled && styles.primaryButtonPressed,
            isDisabled && styles.primaryButtonDisabled,
          ]}>
          {primaryLoading ? (
            <ActivityIndicator color={colors.onInk} size="small" />
          ) : (
            <Text maxFontSizeMultiplier={1.3} style={styles.primaryLabel}>
              {primaryLabel}
            </Text>
          )}
        </Pressable>
      </View>
      {isDisabled && disabledReason ? (
        <Text maxFontSizeMultiplier={1.5} style={styles.reason}>
          {disabledReason}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    wrap: {
      gap: spacing.xs,
      width: '100%',
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    backButton: {
      minHeight: 44,
      paddingHorizontal: spacing.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: radius.buttonSmall,
    },
    backButtonPressed: {
      backgroundColor: colors.primarySubtle,
    },
    backLabel: {
      ...typography.subheadlineMedium,
      color: colors.primary,
    },
    primaryButton: {
      flex: 1,
      minHeight: 46,
      borderRadius: radius.button,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.ink,
    },
    primaryButtonPressed: {
      backgroundColor: colors.inkPressed,
    },
    primaryButtonDisabled: {
      opacity: 0.5,
    },
    primaryLabel: {
      ...typography.buttonPrimary,
      color: colors.onInk,
    },
    reason: {
      ...typography.caption1,
      color: colors.textTertiary,
      textAlign: 'center' as const,
    },
  }));
