import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Pressable, Text, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { iconSize } from '@/constants/theme/design-system';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { triggerImpactHaptic } from '@/lib/haptics';
import { springs } from '@/lib/motion/springs';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

const DEFAULT_ICON = { ios: 'plus', android: 'add', web: 'add' } as const satisfies SymbolName;

export type FloatingActionButtonProps = {
  label: string;
  icon?: SymbolName;
  onPress: () => void;
  style?: ViewStyle;
  testID?: string;
};

/**
 * Shared FAB for the clients/invoices/quotes lists — each screen owns its
 * own `onPress` (routing, plan-limit guard, etc.); this only owns the
 * pill shape, elevation, and the spring/haptic press feedback.
 */
export function FloatingActionButton({ label, icon = DEFAULT_ICON, onPress, style, testID }: FloatingActionButtonProps) {
  const styles = useStyles();
  const colors = useColors();
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.wrap, pressStyle, style]}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={() => {
          // eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue mutation is safe here.
          scale.value = withSpring(0.94, springs.snappy);
          void triggerImpactHaptic();
        }}
        onPressOut={() => {
          // eslint-disable-next-line react-hooks/immutability
          scale.value = withSpring(1, springs.snappy);
        }}
        style={styles.fab}
        testID={testID}>
        <SymbolView name={icon} size={iconSize.md} tintColor={colors.onPrimary} type="hierarchical" />
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    wrap: {
      position: 'absolute',
      right: spacing.screenPaddingHorizontal,
    },
    fab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.primary,
      borderRadius: radius.full,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      minHeight: 56,
      ...shadows.floating,
    },
    label: {
      ...typography.subheadlineMedium,
      color: colors.onPrimary,
    },
  }));
}
