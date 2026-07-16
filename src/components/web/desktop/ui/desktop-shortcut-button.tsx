import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type DesktopShortcutButtonProps = {
  label: string;
  description?: string;
  icon: SymbolName;
  onPress: () => void;
  disabled?: boolean;
};

export function DesktopShortcutButton({
  label,
  description,
  icon,
  onPress,
  disabled = false,
}: DesktopShortcutButtonProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <View style={styles.iconWrap}>
        <SymbolView
          name={icon}
          size={18}
          tintColor={disabled ? colors.iconTertiary : colors.primary}
          type="hierarchical"
        />
      </View>
      <View style={styles.text}>
        <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={14}
        tintColor={colors.textTertiary}
        type="hierarchical"
      />
    </Pressable>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    pressed: {
      backgroundColor: colors.primarySubtle,
      opacity: 0.92,
    },
    disabled: {
      opacity: 0.55,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    text: {
      flex: 1,
      gap: 2,
    },
    label: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    labelDisabled: {
      color: colors.textTertiary,
    },
    description: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
  }));
