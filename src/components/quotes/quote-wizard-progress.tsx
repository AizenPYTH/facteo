import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

const STEPS = [
  'Client',
  'Produits',
  'Quantités',
  'Récapitulatif',
] as const;

type QuoteWizardProgressProps = {
  currentStep: number;
};

export function QuoteWizardProgress({ currentStep }: QuoteWizardProgressProps) {
  return (
    <View style={styles.container}>
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <View key={label} style={styles.step}>
            <View
              style={[
                styles.bullet,
                isActive && styles.bulletActive,
                isCompleted && styles.bulletCompleted,
              ]}>
              <Text
                style={[
                  styles.bulletText,
                  isActive && styles.bulletTextOnPrimary,
                  isCompleted && styles.bulletTextActive,
                ]}>
                {stepNumber}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[styles.label, isActive && styles.labelActive]}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  bullet: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bulletActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bulletCompleted: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
  },
  bulletText: {
    ...typography.footnoteMedium,
    color: colors.textSecondary,
  },
  bulletTextActive: {
    color: colors.primary,
  },
  bulletTextOnPrimary: {
    color: colors.onPrimary,
  },
  label: {
    ...typography.caption2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  labelActive: {
    color: colors.text,
    ...typography.footnoteMedium,
  },
});
