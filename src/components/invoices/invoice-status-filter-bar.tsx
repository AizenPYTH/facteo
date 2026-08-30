import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import type { InvoiceStatusFilter } from '@/types/invoices-list';
import { INVOICE_STATUS_FILTER_OPTIONS } from '@/types/invoices-list';

type InvoiceStatusFilterBarProps = {
  value: InvoiceStatusFilter;
  onChange: (value: InvoiceStatusFilter) => void;
  /** Compteurs par statut (ignorent le filtre actif). */
  counts?: Partial<Record<InvoiceStatusFilter, number>>;
};

export function InvoiceStatusFilterBar({
  value,
  onChange,
  counts,
}: InvoiceStatusFilterBarProps) {
  const styles = useStyles();

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}>
      {INVOICE_STATUS_FILTER_OPTIONS.map((option) => {
        const isActive = option.value === value;
        const count = counts?.[option.value];
        const label =
          typeof count === 'number' ? `${option.label} ${count}` : option.label;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, isActive && styles.chipActive]}>
            <Text
              maxFontSizeMultiplier={1.3}
              style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    content: {
      gap: spacing.xs,
      paddingVertical: spacing.xs,
      paddingRight: spacing.md,
    },
    chip: {
      borderRadius: radius.filterChip,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 6,
      minHeight: 32,
      justifyContent: 'center',
    },
    chipActive: {
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    chipLabel: {
      ...typography.caption1,
      fontWeight: '500',
      fontSize: 13,
      color: colors.textSecondary,
    },
    chipLabelActive: {
      color: colors.onInk,
    },
  }));
}
