import { Text, View } from 'react-native';

import { useColors, useThemedStyles, type AppColors } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type StatusTone = 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'error';

type StatusBadgeProps = {
  label: string;
  tone: StatusTone;
};

/**
 * Generic pill badge — the visual base for invoice/quote status badges
 * (and anywhere else a status needs a tone rather than a domain-specific
 * component). Each domain maps its own status enum to a tone + label;
 * the pill styling itself only needs to exist once.
 */
export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const colors = useColors();
  const styles = useStyles();
  const palette = toneColors(colors)[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

function toneColors(colors: AppColors): Record<StatusTone, { background: string; text: string }> {
  return {
    neutral: { background: colors.backgroundSecondary, text: colors.textSecondary },
    primary: { background: colors.primarySubtle, text: colors.primary },
    info: { background: colors.infoSubtle, text: colors.info },
    success: { background: colors.successSubtle, text: colors.success },
    warning: { background: colors.warningSubtle, text: colors.warning },
    error: { background: colors.errorSubtle, text: colors.error },
  };
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
