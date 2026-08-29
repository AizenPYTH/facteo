import { Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { useIsLargeContentSize } from '@/hooks/use-is-large-content-size';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatPriceHT, formatSpokenEuros } from '@/lib/format/currency';

type WizardTotalsSummaryProps = {
  totalHt: number;
  totalTtc: number;
};

/** Récapitulatif dans la barre d’action wizard — DESIGN §5.3. */
export function WizardTotalsSummary({ totalHt, totalTtc }: WizardTotalsSummaryProps) {
  const styles = useStyles();
  const isLargeContentSize = useIsLargeContentSize();

  return (
    <View style={[styles.row, isLargeContentSize && styles.rowLarge]}>
      <Text style={styles.label}>Total</Text>
      <Text
        accessibilityLabel={`${formatSpokenEuros(totalHt)} hors taxes, ${formatSpokenEuros(totalTtc)} toutes taxes comprises`}
        style={styles.value}>
        {formatPriceHT(totalHt)} HT · {formatPriceHT(totalTtc)} TTC
      </Text>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
    },
    rowLarge: {
      flexDirection: 'column' as const,
      alignItems: 'flex-start' as const,
    },
    label: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
    },
    value: {
      ...typography.subheadlineMedium,
      color: colors.text,
      fontVariant: ['tabular-nums'] as const,
      flexShrink: 1,
      textAlign: 'right' as const,
    },
  }));
}
