import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { press } from '@/constants/theme/interaction';
import { spring } from '@/constants/theme/motion';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { elevation } from '@/constants/theme/surfaces';
import { type } from '@/constants/theme/type-roles';
import { triggerHaptic } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SymbolName = ComponentProps<typeof SymbolView>['name'];

export type QuickActionCardProps = {
  label: string;
  icon: SymbolName;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function QuickActionCard({
  label,
  icon,
  onPress,
  disabled = false,
  style,
  testID,
}: QuickActionCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        if (disabled) return;
        void triggerHaptic('selection');
        onPress();
      }}
      onPressIn={() => {
        if (!disabled) {
          scale.value = withSpring(press.card.scale, spring.snappy);
        }
      }}
      onPressOut={() => {
        scale.value = withSpring(1, spring.snappy);
      }}
      style={[
        styles.card,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      testID={testID}>
      <View style={[styles.iconWell, disabled && styles.iconWellDisabled]}>
        <SymbolView
          name={icon}
          size={20}
          tintColor={disabled ? colors.iconTertiary : colors.primary}
          type="hierarchical"
        />
      </View>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
    </AnimatedPressable>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    card: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      minHeight: 96,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...elevation[1],
    },
    iconWell: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWellDisabled: {
      backgroundColor: colors.backgroundSecondary,
    },
    disabled: {
      opacity: 0.5,
    },
    label: {
      ...type.badge,
      fontSize: 12,
      color: colors.text,
      textAlign: 'center',
    },
    labelDisabled: {
      color: colors.textTertiary,
    },
  }));
}
