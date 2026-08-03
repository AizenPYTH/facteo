import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Pressable, Text, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { triggerImpactHaptic } from '@/lib/haptics';
import { springs } from '@/lib/motion/springs';

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
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[pressStyle, styles.flex]}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          if (disabled) {
            return;
          }
          // Reanimated SharedValue mutation is safe outside render; the
          // compiler's immutability check doesn't yet recognize it.
          // eslint-disable-next-line react-hooks/immutability
          scale.value = withSpring(0.94, springs.snappy);
          void triggerImpactHaptic();
        }}
        onPressOut={() => {
          // eslint-disable-next-line react-hooks/immutability
          scale.value = withSpring(1, springs.snappy);
        }}
        style={[styles.card, disabled && styles.disabled, style]}
        testID={testID}>
        <SymbolView
          name={icon}
          size={22}
          tintColor={disabled ? colors.iconTertiary : colors.primary}
          type="hierarchical"
        />
        <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  flex: {
    flex: 1,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 88,
    ...shadows.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.footnoteMedium,
    color: colors.text,
    textAlign: 'center',
  },
  labelDisabled: {
    color: colors.textTertiary,
  },
}));
}
