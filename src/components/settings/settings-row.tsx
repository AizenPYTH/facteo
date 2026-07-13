import { SymbolView } from 'expo-symbols';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type SettingsRowProps = {
  label: string;
  value?: string;
  destructive?: boolean;
  showChevron?: boolean;
  onPress?: () => void;
  trailing?: ReactNode;
  style?: ViewStyle;
};

export function SettingsRow({
  label,
  value,
  destructive = false,
  showChevron,
  onPress,
  trailing,
  style,
}: SettingsRowProps) {
  const styles = useStyles();
  const colors = useColors();
  const shouldShowChevron = showChevron ?? (Boolean(onPress) && !trailing);
  const content = (
    <>
      <Text
        style={[
          styles.label,
          destructive ? styles.destructiveLabel : null,
        ]}>
        {label}
      </Text>
      <View style={styles.trailing}>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        {trailing}
        {shouldShowChevron ? (
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={14}
            tintColor={colors.textTertiary}
            type="hierarchical"
          />
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.row, style]}>{content}</View>;
}

function useStyles() {
  return useThemedStyles((colors) => ({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  pressed: {
    backgroundColor: colors.backgroundSelected,
  },
  label: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    flexShrink: 1,
  },
  destructiveLabel: {
    color: colors.error,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
    maxWidth: '50%',
  },
  value: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'right',
    flexShrink: 1,
  },
}));
}
