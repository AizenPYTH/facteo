import { SymbolView } from 'expo-symbols';
import { Text, View, type ViewStyle } from 'react-native';

import { Card } from '@/components/ui/card';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useCountUp } from '@/lib/motion/use-count-up';
import { useReduceMotion } from '@/hooks/use-reduce-motion';

export type StatCardProps = {
  label: string;
  /** Valeur déjà formatée. Ignorée si `amount` et `format` sont fournis. */
  value: string;
  /** Valeur numérique à animer. Sans elle, `value` s'affiche tel quel. */
  amount?: number;
  /** Mise en forme de la valeur animée. */
  format?: (value: number) => string;
  accentColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
  premiumLocked?: boolean;
};

/**
 * Indicateur chiffré. Repose sur `Card` — plus de surface maison — et anime le
 * nombre sur le thread JS via `useCountUp`.
 */
export function StatCard({
  label,
  value,
  amount,
  format,
  accentColor,
  onPress,
  style,
  testID,
  premiumLocked = false,
}: StatCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const reduceMotion = useReduceMotion();
  const resolvedAccent = accentColor ?? colors.primary;

  // Le compteur ne tourne que si l'on a un nombre, une mise en forme, aucune
  // réduction d'animation demandée et aucun verrou premium (une valeur floutée
  // qui s'anime attire l'œil pour rien).
  const animated = amount !== undefined && format !== undefined;
  const counted = useCountUp(amount ?? 0, {
    formatter: format ?? String,
    enabled: animated && !reduceMotion && !premiumLocked,
  });
  const displayed = animated ? counted : value;

  return (
    <Card
      accessibilityLabel={`${label} : ${displayed}`}
      onPress={onPress}
      style={[styles.card, premiumLocked && styles.locked, style]}
      testID={testID}
      variant="elevated">
      <View style={[styles.accent, { backgroundColor: resolvedAccent }]} />

      {premiumLocked ? (
        <View style={styles.lockBadge}>
          <SymbolView name="lock.fill" size={11} tintColor={colors.textTertiary} />
        </View>
      ) : null}

      <Text maxFontSizeMultiplier={1.5} numberOfLines={2} style={styles.label}>
        {label}
      </Text>
      <Text
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1.3}
        numberOfLines={1}
        style={[styles.value, premiumLocked && styles.valueLocked]}>
        {displayed}
      </Text>
    </Card>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    card: {
      gap: spacing[1],
      paddingTop: spacing[5],
    },
    locked: {
      opacity: 0.88,
    },
    lockBadge: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      zIndex: 1,
    },
    accent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
    },
    label: {
      ...typography.footnote,
      color: colors.textSecondary,
      flexShrink: 1,
    },
    value: {
      ...typography.title2,
      color: colors.text,
      flexShrink: 1,
    },
    valueLocked: {
      color: colors.textSecondary,
    },
  }));
}
