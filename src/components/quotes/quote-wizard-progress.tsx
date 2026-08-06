import { SymbolView } from 'expo-symbols';
import { Fragment, useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

import { iconSize, motion } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';

const STEPS = ['Client', 'Prestations', 'Validation'] as const;

type QuoteWizardProgressProps = {
  currentStep: number;
};

export function QuoteWizardProgress({ currentStep }: QuoteWizardProgressProps) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;

        return (
          <Fragment key={label}>
            {index > 0 ? <Connector filled={stepNumber <= currentStep} /> : null}
            <Step
              isActive={stepNumber === currentStep}
              isCompleted={stepNumber < currentStep}
              label={label}
              stepNumber={stepNumber}
            />
          </Fragment>
        );
      })}
    </View>
  );
}

type StepProps = {
  stepNumber: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
};

function Step({ stepNumber, label, isActive, isCompleted }: StepProps) {
  const styles = useStyles();
  const colors = useColors();
  const progress = useSharedValue(isCompleted ? 2 : isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isCompleted ? 2 : isActive ? 1 : 0, { duration: motion.fast });
  }, [isActive, isCompleted, progress]);

  const bulletStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1, 2],
      [colors.backgroundSecondary, colors.primary, colors.primarySubtle],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1, 2],
      [colors.border, colors.primary, colors.primary],
    ),
  }));

  const numberStyle = useAnimatedStyle(() => ({
    opacity: progress.value < 2 ? 1 : 0,
    color: interpolateColor(progress.value, [0, 1], [colors.textSecondary, colors.onPrimary]),
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: progress.value === 2 ? 1 : 0,
    transform: [{ scale: progress.value === 2 ? 1 : 0.5 }],
  }));

  return (
    <View style={styles.step}>
      <Animated.View style={[styles.bullet, bulletStyle]}>
        <Animated.Text style={[styles.bulletText, numberStyle]}>{stepNumber}</Animated.Text>
        <Animated.View style={[styles.checkWrap, checkStyle]}>
          <SymbolView name="checkmark" size={iconSize.sm} tintColor={colors.primary} />
        </Animated.View>
      </Animated.View>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        numberOfLines={1}
        style={[styles.label, isActive && styles.labelActive]}>
        {label}
      </Text>
    </View>
  );
}

function Connector({ filled }: { filled: boolean }) {
  const styles = useStyles();
  const colors = useColors();
  const progress = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(filled ? 1 : 0, { duration: motion.normal });
  }, [filled, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.border, colors.primary]),
  }));

  return (
    <View style={styles.connectorTrack}>
      <Animated.View style={[styles.connectorFill, fillStyle]} />
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.screenPaddingHorizontal,
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
    borderWidth: 1,
  },
  bulletText: {
    ...typography.footnoteMedium,
    position: 'absolute',
  },
  checkWrap: {
    position: 'absolute',
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
  connectorTrack: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
    marginTop: 13,
    overflow: 'hidden',
  },
  connectorFill: {
    flex: 1,
    borderRadius: 1,
  },
}));
}
