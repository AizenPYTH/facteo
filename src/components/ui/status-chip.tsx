import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors, useThemedStyles, type AppColors } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type StatusTone = 'paid' | 'sent' | 'pending' | 'overdue' | 'draft';

type StatusChipProps = {
  label: string;
  tone: StatusTone;
  style?: StyleProp<ViewStyle>;
};

/**
 * Puce de statut — DESIGN §3.5
 * r 6, 11/600, teinte de fond du statut. Le statut n'est jamais porté par la seule couleur.
 */
export function StatusChip({ label, tone, style }: StatusChipProps) {
  const styles = useStyles();
  const colors = useColors();
  const palette = statusToneFromColors(colors)[tone];

  return (
    <View
      accessibilityLabel={label}
      style={[styles.chip, { backgroundColor: palette.background }, style]}>
      <Text maxFontSizeMultiplier={1.4} style={[styles.label, { color: palette.text }]}>
        {label}
      </Text>
    </View>
  );
}

export function statusToneFromColors(colors: AppColors): Record<
  StatusTone,
  { text: string; background: string }
> {
  return {
    paid: { text: colors.statusPaid, background: colors.statusPaidBg },
    sent: { text: colors.statusSent, background: colors.statusSentBg },
    pending: { text: colors.statusPending, background: colors.statusPendingBg },
    overdue: { text: colors.statusOverdue, background: colors.statusOverdueBg },
    draft: { text: colors.statusDraft, background: colors.statusDraftBg },
  };
}

function useStyles() {
  return useThemedStyles(() => ({
    chip: {
      alignSelf: 'flex-start' as const,
      borderRadius: radius.badge,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    label: {
      ...typography.statusChip,
    },
  }));
}
