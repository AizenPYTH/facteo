import { SymbolView } from 'expo-symbols';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { spacing } from '@/constants/theme/spacing';
import { radius } from '@/constants/theme/radius';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { formatCurrency } from '@/lib/format/currency';
import { useCountUp } from '@/lib/motion/use-count-up';

export type DashboardHeroProps = {
  /** Encaissé sur le mois en cours. */
  monthlyRevenue: number;
  /** Encaissé sur l'année en cours, affiché en second rang. */
  yearlyRevenue: number;
  /** Mois précédent, quand la donnée est disponible : sert à la tendance. */
  previousMonthRevenue?: number;
  onPress?: () => void;
};

/** Variation en pourcentage, ou null quand elle n'a pas de sens à afficher. */
function computeTrend(current: number, previous?: number): number | null {
  if (previous === undefined || previous <= 0) {
    // Partir de zéro donnerait « +∞ % » : on n'affiche rien.
    return null;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Carte de tête du tableau de bord.
 *
 * Un seul chiffre domine l'écran — l'encaissé du mois — au lieu des trois
 * indicateurs de même poids qui se disputaient l'attention. Tout le reste de la
 * page se lit comme un complément de celui-ci.
 */
export function DashboardHero({
  monthlyRevenue,
  yearlyRevenue,
  previousMonthRevenue,
  onPress,
}: DashboardHeroProps) {
  const styles = useStyles();
  const colors = useColors();
  const reduceMotion = useReduceMotion();

  const value = useCountUp(monthlyRevenue, {
    formatter: formatCurrency,
    enabled: !reduceMotion,
  });

  const trend = computeTrend(monthlyRevenue, previousMonthRevenue);
  const positive = (trend ?? 0) >= 0;

  return (
    <Card
      accessibilityLabel={`Encaissé ce mois : ${formatCurrency(monthlyRevenue)}`}
      onPress={onPress}
      style={styles.card}
      variant="elevated">
      <View style={styles.labelRow}>
        <Text maxFontSizeMultiplier={1.4} style={styles.label}>
          Encaissé ce mois
        </Text>

        {trend !== null ? (
          <View
            style={[
              styles.trend,
              { backgroundColor: positive ? colors.successSubtle : colors.errorSubtle },
            ]}>
            <SymbolView
              name={
                positive
                  ? { ios: 'arrow.up.right', android: 'trending_up', web: 'trending_up' }
                  : { ios: 'arrow.down.right', android: 'trending_down', web: 'trending_down' }
              }
              size={11}
              tintColor={positive ? colors.success : colors.error}
              type="hierarchical"
            />
            <Text
              maxFontSizeMultiplier={1.3}
              style={[styles.trendLabel, { color: positive ? colors.success : colors.error }]}>
              {`${positive ? '+' : ''}${Math.round(trend)} %`}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1.2}
        numberOfLines={1}
        style={styles.value}>
        {value}
      </Text>

      <Text maxFontSizeMultiplier={1.4} style={styles.secondary}>
        {`${formatCurrency(yearlyRevenue)} depuis janvier`}
      </Text>
    </Card>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    card: {
      gap: spacing[1],
      paddingVertical: spacing[5],
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing[2],
    },
    label: {
      ...typography.subheadlineMedium,
      color: colors.textSecondary,
      flexShrink: 1,
    },
    trend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[0.5],
      borderRadius: radius.full,
    },
    trendLabel: {
      ...typography.caption1,
      fontWeight: '600' as const,
    },
    value: {
      ...typography.largeTitle,
      color: colors.text,
    },
    secondary: {
      ...typography.footnote,
      color: colors.textTertiary,
    },
  }));
}
