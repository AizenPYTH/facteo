import { Pressable, ScrollView, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { springs } from '@/lib/motion/springs';

type StatusFilterOption<T extends string> = {
  value: T;
  label: string;
};

type StatusFilterBarProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: readonly StatusFilterOption<T>[];
};

/** Shared filter-chip row for invoices/quotes status filters. */
export function StatusFilterBar<T extends string>({ value, onChange, options }: StatusFilterBarProps<T>) {
  const styles = useStyles();
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}>
      {options.map((option) => (
        <FilterChip
          isActive={option.value === value}
          key={option.value}
          label={option.label}
          onPress={() => onChange(option.value)}
        />
      ))}
    </ScrollView>
  );
}

function FilterChip({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) {
  const styles = useStyles();
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={pressStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        onPress={onPress}
        onPressIn={() => {
          // eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue mutation is safe here.
          scale.value = withSpring(0.94, springs.snappy);
        }}
        onPressOut={() => {
          // eslint-disable-next-line react-hooks/immutability
          scale.value = withSpring(1, springs.snappy);
        }}
        style={[styles.chip, isActive && styles.chipActive]}>
        <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    content: {
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    chip: {
      backgroundColor: colors.surface,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipActive: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primary,
    },
    chipLabel: {
      ...typography.subheadlineMedium,
      color: colors.textSecondary,
    },
    chipLabelActive: {
      color: colors.primary,
    },
  }));
}
