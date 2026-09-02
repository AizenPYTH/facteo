import { ScrollView, StyleSheet, Text } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type ClientTypeFilter = 'all' | 'company' | 'individual';

const OPTIONS: { value: ClientTypeFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'company', label: 'Professionnels' },
  { value: 'individual', label: 'Particuliers' },
];

type ClientTypeFilterBarProps = {
  value: ClientTypeFilter;
  onChange: (value: ClientTypeFilter) => void;
};

export function ClientTypeFilterBar({ value, onChange }: ClientTypeFilterBarProps) {
  const styles = useStyles();

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}>
      {OPTIONS.map((option) => {
        const isActive = option.value === value;

        return (
          <Text
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, isActive && styles.chipActive]}>
            {option.label}
          </Text>
        );
      })}
    </ScrollView>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    content: {
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    chip: {
      ...typography.subheadlineMedium,
      color: colors.textSecondary,
      backgroundColor: colors.surface,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      overflow: 'hidden',
    },
    chipActive: {
      color: colors.primary,
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primary,
    },
  }));
}
