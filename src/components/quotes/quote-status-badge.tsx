import { Text, View } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { QUOTE_STATUS_LABELS, type QuoteStatus } from '@/types/quote';

type QuoteStatusBadgeProps = {
  status: QuoteStatus;
};

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  const colors = useColors();
  const styles = useStyles();
  const palette = getStatusColors(colors)[status];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.text }]}>
        {QUOTE_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

function getStatusColors(colors: ReturnType<typeof useColors>) {
  return {
    draft: { background: colors.backgroundSecondary, text: colors.textSecondary },
    sent: { background: colors.primarySubtle, text: colors.primary },
    accepted: { background: colors.successSubtle, text: colors.success },
    rejected: { background: colors.errorSubtle, text: colors.error },
    expired: { background: colors.warningSubtle, text: colors.warning },
    converted: { background: colors.primarySubtle, text: colors.primary },
  } satisfies Record<QuoteStatus, { background: string; text: string }>;
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
