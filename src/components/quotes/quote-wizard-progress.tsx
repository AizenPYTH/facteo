import { Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

const STEPS = ['Client', 'Prestations', 'Validation'] as const;

type QuoteWizardProgressProps = {
  currentStep: number;
};

/**
 * DESIGN §5.3 : jauge de progression en trois segments, pas trois pastilles.
 * Chaque segment se remplit pour l'étape courante et les étapes franchies.
 */
export function QuoteWizardProgress({ currentStep }: QuoteWizardProgressProps) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {STEPS.map((_, index) => {
          const stepNumber = index + 1;
          const isFilled = stepNumber <= currentStep;

          return (
            <View
              key={STEPS[index]}
              style={[styles.segment, isFilled && styles.segmentFilled]}
            />
          );
        })}
      </View>
      <Text maxFontSizeMultiplier={1.4} style={styles.label}>
        Étape {currentStep} / {STEPS.length} · {STEPS[currentStep - 1]}
      </Text>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      gap: spacing.xs,
      paddingHorizontal: spacing.screenPaddingHorizontal,
    },
    track: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    segment: {
      flex: 1,
      height: 4,
      borderRadius: radius.badge,
      backgroundColor: colors.border,
    },
    segmentFilled: {
      backgroundColor: colors.primary,
    },
    label: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
    },
  }));
}
