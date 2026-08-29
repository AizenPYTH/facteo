import { Pressable, Text, View } from 'react-native';

import { triggerSelectionHaptic } from '@/lib/haptics';
import { useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { shadows } from '@/constants/theme/theme';
import { typography } from '@/constants/theme/typography';

export type SegmentedControlOption<TValue extends string> = {
    10|  value: TValue;
  label: string;
};

type SegmentedControlProps<TValue extends string> = {
  options: readonly SegmentedControlOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  accessibilityLabel?: string;
};

    20|/**
 * Sélecteur à options exclusives — DESIGN §5.5 (Entreprise / Particulier).
 * Piste neutre, option active sur carte avec ombre 1px (`shadows.segmented`).
 */
export function SegmentedControl<TValue extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<TValue>) {
    30|  const styles = useStyles();

  return (
    <View accessibilityLabel={accessibilityLabel} accessibilityRole="tablist" style={styles.track}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <Pressable
            accessibilityRole="tab"
    40|            accessibilityState={{ selected: isActive }}
            key={option.value}
            onPress={() => {
              if (!isActive) {
                void triggerSelectionHaptic();
                onChange(option.value);
              }
            }}
            style={({ pressed }) => [
    50|              styles.option,
              isActive && styles.optionActive,
              pressed && !isActive && styles.optionPressed,
            ]}>
            <Text
              maxFontSizeMultiplier={1.4}
              style={[styles.label, isActive && styles.labelActive]}>
              {option.label}
            </Text>
          </Pressable>
    60|        );
      })}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    track: {
      flexDirection: 'row' as const,
      backgroundColor: colors.surfaceSecondary,
    70|      borderRadius: radius.segmented,
      padding: spacing.xs,
      gap: spacing.xs,
    },
    option: {
      flex: 1,
      minHeight: components.touchTarget,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: radius.sm,
    80|    },
    optionActive: {
      backgroundColor: colors.surface,
      ...shadows.segmented,
    },
    optionPressed: {
      backgroundColor: colors.border,
    },
    label: {
      ...typography.subheadlineMedium,
      color: colors.textSecondary,
    90|    },
    labelActive: {
      color: colors.text,
    },
  }));
}
