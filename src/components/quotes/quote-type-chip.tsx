import { Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

/**
 * Puce noire « DEVIS » en tête du détail — DESIGN §5.4.
 * Seul signe distinctif entre le détail facture et le détail devis.
 */
export function QuoteTypeChip() {
  const styles = useStyles();

  return (
    <View accessibilityLabel="Devis" style={styles.chip}>
      <Text maxFontSizeMultiplier={1.4} style={styles.label}>
        DEVIS
      </Text>
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    chip: {
      alignSelf: 'flex-start' as const,
      backgroundColor: colors.ink,
      borderRadius: radius.badge,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    label: {
      ...typography.statusChip,
      color: colors.onInk,
      letterSpacing: 0.09 * 11,
    },
  }));
