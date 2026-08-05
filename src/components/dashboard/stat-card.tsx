import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { BlurredTeaser } from '@/components/ui/blurred-teaser';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useCountUp } from '@/lib/motion/use-count-up';

export type StatCardProps = {
  label: string;
  /** Static display value. Ignored once `numericValue` is provided. */
  value: string;
  /** When set, the value counts up from 0 on mount instead of appearing static. */
  numericValue?: number;
  /** Formats `numericValue` at each animation frame — defaults to a plain integer. */
  formatValue?: (value: number) => string;
  accentColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
  premiumLocked?: boolean;
};

/**
 * Lot 03b: reintroduce useCountUp only (no press springs / fadeIn / BlurView).
 */
export function StatCard({
  label,
  value,
  numericValue,
  formatValue,
  accentColor,
  onPress,
  style,
  testID,
  premiumLocked = false,
}: StatCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const resolvedAccent = accentColor ?? colors.primary;

  const countUpProps = useCountUp(numericValue ?? 0, {
    formatter: formatValue ?? ((v) => String(Math.round(v))),
  });

  const valueNode =
    numericValue !== undefined ? (
      <Animated.Text
        animatedProps={countUpProps}
        style={[styles.value, premiumLocked ? styles.valueLocked : null]}>
        {formatValue ? formatValue(numericValue) : String(Math.round(numericValue))}
      </Animated.Text>
    ) : (
      <Text style={[styles.value, premiumLocked ? styles.valueLocked : null]}>{value}</Text>
    );

  const content = (
    <>
      <LinearGradient
        colors={[resolvedAccent, `${resolvedAccent}66`]}
        end={{ x: 1, y: 0 }}
        start={{ x: 0, y: 0 }}
        style={styles.accent}
      />
      {premiumLocked ? (
        <View style={styles.lockBadge}>
          <SymbolView name="lock.fill" size={11} tintColor={colors.textTertiary} />
        </View>
      ) : null}
      <Text style={styles.label}>{label}</Text>
      <BlurredTeaser active={premiumLocked} cornerRadius={radius.sm} intensity={16}>
        {valueNode}
      </BlurredTeaser>
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.card, premiumLocked ? styles.cardLocked : null, style]} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.card, premiumLocked ? styles.cardLocked : null, style]}
      testID={testID}>
      {content}
    </Pressable>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      padding: spacing.md,
      gap: spacing.sm,
      overflow: 'hidden',
      ...shadows.card,
    },
    cardLocked: {
      opacity: 0.96,
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
      marginTop: spacing.xs,
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
