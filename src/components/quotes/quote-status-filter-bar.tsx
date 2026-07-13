import { ScrollView, StyleSheet, Text } from 'react-native';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import type { QuoteStatusFilter } from '@/types/quotes-list';
import { QUOTE_STATUS_FILTER_OPTIONS } from '@/types/quotes-list';

type QuoteStatusFilterBarProps = {
  value: QuoteStatusFilter;
  onChange: (value: QuoteStatusFilter) => void;
};

export function QuoteStatusFilterBar({ value, onChange }: QuoteStatusFilterBarProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}>
      {QUOTE_STATUS_FILTER_OPTIONS.map((option) => {
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
