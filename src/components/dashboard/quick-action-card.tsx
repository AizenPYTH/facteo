import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { triggerImpactHaptic } from '@/lib/haptics';

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

  return (
    <View style={styles.flex}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => {
          if (disabled) {
            return;
          }
          void triggerImpactHaptic();
          onPress();
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
    </View>
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
