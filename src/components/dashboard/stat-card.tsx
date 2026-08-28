import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { press } from '@/constants/theme/interaction';
import { spring } from '@/constants/theme/motion';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { elevation } from '@/constants/theme/surfaces';
import { type } from '@/constants/theme/type-roles';
import { triggerHaptic } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type StatCardProps = {
  label: string;
  value: string;
  /** Semantic tint for the value only — never a decorative bar. */
  accentColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
  premiumLocked?: boolean;
};

export function StatCard({
  label,
  value,
  accentColor,
  onPress,
  style,
  testID,
  premiumLocked = false,
}: StatCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const valueColor = premiumLocked
    ? colors.textSecondary
    : (accentColor ?? colors.text);

  const content = (
    <>
      {premiumLocked ? (
        <View style={styles.lockBadge}>
          <SymbolView name="lock.fill" size={11} tintColor={colors.textTertiary} />
        </View>
      ) : null}
      <Text style={styles.label}>{label}</Text>
      <Text
        adjustsFontSizeToFit
        numberOfLines={1}
        style={[styles.value, { color: valueColor }]}>
        {value}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        accessibilityRole="button"
        onPress={() => {
          void triggerHaptic('selection');
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(press.card.scale, spring.snappy);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, spring.snappy);
        }}
        style={[styles.card, premiumLocked ? styles.cardLocked : null, animatedStyle, style]}
        testID={testID}>
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <View style={[styles.card, premiumLocked ? styles.cardLocked : null, style]} testID={testID}>
      {content}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      gap: spacing[1.5],
      minHeight: 92,
      justifyContent: 'space-between',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...elevation[1],
    },
    cardLocked: {
      opacity: 0.88,
    },
    lockBadge: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      zIndex: 1,
    },
    label: {
      ...type.caption,
      color: colors.textSecondary,
    },
    value: {
      ...type.primaryNumber,
      letterSpacing: -0.4,
    },
  }));
}
