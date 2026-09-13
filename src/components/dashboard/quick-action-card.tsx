import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Text, View, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { shadows } from '@/constants/theme/theme';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

export type QuickActionCardProps = {
  label: string;
  icon: SymbolName;
  onPress: () => void;
  /**
   * `primary` pour les deux créations principales — facture et devis. Les
   * actions secondaires restent discrètes pour ne pas concurrencer.
   */
  emphasis?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function QuickActionCard({
  label,
  icon,
  onPress,
  emphasis = 'secondary',
  disabled = false,
  style,
  testID,
}: QuickActionCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const primary = emphasis === 'primary';

  const tint = disabled
    ? colors.iconTertiary
    : primary
      ? colors.onPrimary
      : colors.primary;

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.card,
        primary ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        style,
      ]}
      testID={testID}>
      <View style={[styles.iconWrap, primary ? styles.iconWrapPrimary : styles.iconWrapSecondary]}>
        <SymbolView name={icon} size={20} tintColor={tint} type="hierarchical" />
      </View>
      <Text
        maxFontSizeMultiplier={1.4}
        numberOfLines={2}
        style={[
          styles.label,
          primary && styles.labelPrimary,
          disabled && styles.labelDisabled,
        ]}>
        {label}
      </Text>
    </PressableScale>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    card: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[2],
      borderRadius: radius.card,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing[2],
      minHeight: 96,
    },
    primary: {
      backgroundColor: colors.primary,
      ...shadows.card,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    disabled: {
      opacity: 0.5,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapPrimary: {
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
    },
    iconWrapSecondary: {
      backgroundColor: colors.primarySubtle,
    },
    label: {
      ...typography.footnoteMedium,
      color: colors.text,
      textAlign: 'center',
    },
    labelPrimary: {
      color: colors.onPrimary,
      fontWeight: '600' as const,
    },
    labelDisabled: {
      color: colors.textTertiary,
    },
  }));
}
