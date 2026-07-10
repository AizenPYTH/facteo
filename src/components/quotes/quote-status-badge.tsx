import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { QUOTE_STATUS_LABELS, type QuoteStatus } from '@/types/quote';

const STATUS_COLORS: Record<
  QuoteStatus,
  { background: string; text: string }
> = {
  draft: { background: colors.backgroundSecondary, text: colors.textSecondary },
  sent: { background: colors.primarySubtle, text: colors.primary },
  accepted: { background: colors.successSubtle, text: colors.success },
  rejected: { background: '#FEE2E2', text: colors.error },
  expired: { background: colors.warningSubtle, text: colors.warning },
};

type QuoteStatusBadgeProps = {
  status: QuoteStatus;
};

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  const palette = STATUS_COLORS[status];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.text }]}>
        {QUOTE_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.footnoteMedium,
  },
});
