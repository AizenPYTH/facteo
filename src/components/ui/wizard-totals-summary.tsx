import { Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatPriceHT } from '@/lib/format/currency';

type WizardTotalsSummaryProps = {
  totalHt: number;
  totalTtc: number;
};

/** Récapitulatif dans la barre d’action wizard — DESIGN §5.3. */
export function WizardTotalsSummary({ totalHt, totalTtc }: WizardTotalsSummaryProps) {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Text maxFontSizeMultiplier={1.4} style={styles.label}>
        Total
      </Text>
      <Text maxFontSizeMultiplier={1.4} style={styles.value}>
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
