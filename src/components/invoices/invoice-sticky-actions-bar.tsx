import { Pressable, ScrollView, Text, View } from 'react-native';

import { StickyFooter, useStickyFooterInset } from '@/components/ui/sticky-footer';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { radius } from '@/constants/theme/radius';
import { useThemedStyles } from '@/hooks/use-colors';

export type InvoiceStickyAction = {
  id: string;
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
};

export type InvoiceStickyActionsBarProps = {
  actions: InvoiceStickyAction[];
};

export function useInvoiceStickyActionsInset(): number {
  return useStickyFooterInset();
}

export function InvoiceStickyActionsBar({ actions }: InvoiceStickyActionsBarProps) {
  const styles = useStyles();
  if (actions.length === 0) {
    return null;
  }

  return (
    <StickyFooter>
      <ScrollView
        contentContainerStyle={styles.row}
        horizontal
        showsHorizontalScrollIndicator={false}>
        {actions.map((action) => (
          <Pressable
            accessibilityRole="button"
            disabled={action.disabled}
            key={action.id}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.btn,
              action.primary ? styles.btnPrimary : styles.btnSecondary,
              (pressed || action.disabled) && styles.pressed,
            ]}>
            <Text style={action.primary ? styles.labelPrimary : styles.labelSecondary}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </StickyFooter>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      minHeight: 44,
    },
    btn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.button,
      minHeight: 40,
      justifyContent: 'center' as const,
    },
    btnPrimary: {
      backgroundColor: colors.primary,
    },
    btnSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    labelPrimary: {
      ...typography.footnoteMedium,
      color: colors.onPrimary,
    },
    labelSecondary: {
      ...typography.footnoteMedium,
      color: colors.text,
    },
    pressed: {
      opacity: 0.8,
    },
  }));
}
