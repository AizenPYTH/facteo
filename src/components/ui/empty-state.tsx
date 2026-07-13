import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Button } from '@/components/ui/button';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: SymbolName;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  testID?: string;
};

const DEFAULT_ICON = {
  ios: 'doc.text',
  android: 'description',
  web: 'description',
} as const satisfies SymbolName;

export function EmptyState({
  title,
  description,
  icon = DEFAULT_ICON,
  actionLabel,
  onAction,
  style,
  testID,
}: EmptyStateProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.iconWrap}>
        <SymbolView name={icon} size={28} tintColor={colors.iconTertiary} type="hierarchical" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <Button accessibilityLabel={actionLabel} onPress={onAction} title={actionLabel} />
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  container: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.headline,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    ...typography.subheadline,
    color: colors.textSecondary,
    textAlign: 'center',
  },
}));
}
