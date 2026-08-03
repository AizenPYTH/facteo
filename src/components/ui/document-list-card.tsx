import type { ReactNode } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { press } from '@/constants/theme/interaction';
import { entrance, spring } from '@/constants/theme/motion';
import { spacing } from '@/constants/theme/spacing';
import { type } from '@/constants/theme/type-roles';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { triggerHaptic } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type DocumentListCardProps = {
  number: string;
  clientName: string;
  amountLabel: string;
  dateLabel: string;
  metaLabel?: string | null;
  status: ReactNode;
  accessibilityLabel: string;
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  selectionMode?: boolean;
  index?: number;
  style?: ViewStyle;
  testID?: string;
};

/**
 * Shared document row for Quotes & Invoices.
 * Scan: number + status → client → amount (dominant) → date/meta.
 */
export function DocumentListCard({
  number,
  clientName,
  amountLabel,
  dateLabel,
  metaLabel,
  status,
  accessibilityLabel,
  onPress,
  onLongPress,
  selected = false,
  selectionMode = false,
  index = 0,
  style,
  testID,
}: DocumentListCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const stagger =
    Math.min(index, entrance.listStaggerMax - 1) * entrance.listStagger;

  const body = (
    <View style={[styles.card, selected && styles.cardSelected, style]}>
      {selectionMode ? (
        <View style={styles.selectionWell}>
          <SymbolView
            name={
              selected
                ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
                : { ios: 'circle', android: 'radio_button_unchecked', web: 'radio_button_unchecked' }
            }
            size={22}
            tintColor={selected ? colors.primary : colors.iconTertiary}
            type="hierarchical"
          />
        </View>
      ) : null}

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.number}>
            {number}
          </Text>
          {status}
        </View>

        <Text numberOfLines={1} style={styles.client}>
          {clientName}
        </Text>

        <View style={styles.bottomRow}>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.amount}>
            {amountLabel}
          </Text>
          <View style={styles.metaBlock}>
            <Text style={styles.date}>{dateLabel}</Text>
            {metaLabel ? (
              <Text numberOfLines={1} style={styles.meta}>
                {metaLabel}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );

  const wrapped = onPress || onLongPress ? (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onLongPress={
        onLongPress
          ? () => {
              void triggerHaptic('impactMedium');
              onLongPress();
            }
          : undefined
      }
      onPress={
        onPress
          ? () => {
              void triggerHaptic('selection');
              onPress();
            }
          : undefined
      }
      onPressIn={() => {
        scale.value = withSpring(press.card.scale, spring.snappy);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, spring.snappy);
      }}
      style={animatedStyle}
      testID={testID}>
      {body}
    </AnimatedPressable>
  ) : (
    <View testID={testID}>{body}</View>
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(stagger).duration(entrance.listItemDuration).springify()}>
      {wrapped}
    </Animated.View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
    },
    cardSelected: {
      backgroundColor: colors.primarySubtle,
    },
    selectionWell: {
      width: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      gap: spacing[1.5],
      minWidth: 0,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    number: {
      ...type.cardTitle,
      color: colors.text,
      flexShrink: 1,
      letterSpacing: -0.2,
    },
    client: {
      ...type.secondary,
      color: colors.textSecondary,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.md,
      marginTop: spacing[0.5],
    },
    amount: {
      ...type.primaryNumber,
      color: colors.text,
      flexShrink: 1,
      letterSpacing: -0.5,
    },
    metaBlock: {
      alignItems: 'flex-end',
      gap: 2,
      flexShrink: 0,
    },
    date: {
      ...type.caption,
      color: colors.textTertiary,
    },
    meta: {
      ...type.micro,
      color: colors.textTertiary,
    },
  }));
}
