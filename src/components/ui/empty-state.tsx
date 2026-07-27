import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Text, View, type ViewStyle } from 'react-native';

import { Button } from '@/components/ui/button';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { elevation } from '@/constants/theme/surfaces';
import { type } from '@/constants/theme/type-roles';
import { useColors, useThemedStyles } from '@/hooks/use-colors';

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
        <SymbolView name={icon} size={28} tintColor={colors.primary} type="hierarchical" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <View style={styles.cta}>
          <Button accessibilityLabel={actionLabel} elevated onPress={onAction} title={actionLabel} />
        </View>
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
      width: 64,
      height: 64,
      borderRadius: radius.full,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
      ...elevation[1],
    },
    title: {
      ...type.section,
      fontSize: 20,
      lineHeight: 25,
      color: colors.text,
      textAlign: 'center',
    },
    description: {
      ...type.secondary,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 300,
    },
    cta: {
      marginTop: spacing.sm,
      alignSelf: 'stretch',
      maxWidth: 280,
    },
  }));
}
