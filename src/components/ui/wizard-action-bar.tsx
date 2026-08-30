import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { triggerImpactHaptic } from '@/lib/haptics';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useIsLargeContentSize } from '@/hooks/use-is-large-content-size';
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
  /**
   * Raison affichée sous le primaire quand il est désactivé — DESIGN §5.3 :
   * « un primaire désactivé affiche toujours la raison juste en dessous ».
   */
  disabledReason?: string;
  /** Récapitulatif au-dessus des actions (total…) — DESIGN §3.2. */
  summary?: ReactNode;
};

export function WizardActionBar({
  backLabel,
  onBack,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryLoading = false,
  disabledReason,
  summary,
}: WizardActionBarProps) {
  const styles = useStyles();
  const colors = useColors();
  const isLargeContentSize = useIsLargeContentSize();
  const isDisabled = primaryDisabled || primaryLoading;

  return (
    <View style={styles.container}>
      {summary ? <View style={styles.summary}>{summary}</View> : null}

      <View style={[styles.row, isLargeContentSize && styles.column]}>
        <Pressable
          accessibilityLabel={backLabel}
          accessibilityRole="button"
          onPress={() => {
            void triggerImpactHaptic();
            onBack();
          }}
          style={({ pressed }) => [
            styles.backButton,
            isLargeContentSize && styles.largeButton,
            pressed && styles.backButtonPressed,
          ]}>
          <Text style={styles.backLabel}>{backLabel}</Text>
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
            isLargeContentSize && styles.largePrimaryButton,
            pressed && !isDisabled && styles.primaryButtonPressed,
            isDisabled && styles.primaryButtonDisabled,
          ]}>
          {primaryLoading ? (
            <ActivityIndicator color={colors.onInk} size="small" />
          ) : (
            <Text style={styles.primaryLabel}>{primaryLabel}</Text>
          )}
        </Pressable>
      </View>

      {primaryDisabled && disabledReason ? (
        <Text style={styles.disabledReason}>{disabledReason}</Text>
      ) : null}
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    container: {
      gap: spacing.xs,
    },
    summary: {
      gap: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    column: {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
    backButton: {
      minHeight: 44,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.buttonSmall,
    },
    largeButton: {
      alignSelf: 'stretch',
      width: '100%',
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
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.ink,
    },
    largePrimaryButton: {
      flex: 0,
      width: '100%',
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
    disabledReason: {
      ...typography.caption1,
      color: colors.textTertiary,
      textAlign: 'center',
    },
  }));
