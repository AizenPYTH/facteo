import { Text, View } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '@/types/invoice';

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus;
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const colors = useColors();
  const styles = useStyles();
  const palette = getStatusColors(colors)[status];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.text }]}>
        {INVOICE_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

function getStatusColors(colors: ReturnType<typeof useColors>) {
  return {
    draft: { background: colors.backgroundSecondary, text: colors.textSecondary },
    sent: { background: colors.primarySubtle, text: colors.primary },
    partially_paid: { background: colors.infoSubtle, text: colors.info },
    paid: { background: colors.successSubtle, text: colors.success },
    overdue: { background: colors.warningSubtle, text: colors.warning },
    canceled: { background: colors.errorSubtle, text: colors.error },
  } satisfies Record<InvoiceStatus, { background: string; text: string }>;
}

function useStyles() {
  return useThemedStyles(() => ({
    badge: {
      alignSelf: 'flex-start',
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    label: {
      ...typography.footnoteMedium,
    },
  }));
}
