import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Text, View, type ViewStyle } from 'react-native';

import { Button } from '@/components/ui/button';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
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
  /** Remplit l'espace parent et centre le contenu (auth / listes). */
  fill?: boolean;
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
  fill = false,
}: EmptyStateProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={[styles.container, fill && styles.fill, style]} testID={testID}>
      <View style={styles.iconWrap}>
        <SymbolView name={icon} size={28} tintColor={colors.iconTertiary} type="hierarchical" />
      </View>
      <Text maxFontSizeMultiplier={1.5} style={styles.title}>
        {title}
      </Text>
      <Text maxFontSizeMultiplier={1.5} style={styles.description}>
        {description}
      </Text>
      {actionLabel && onAction ? (
        <Button accessibilityLabel={actionLabel} onPress={onAction} title={actionLabel} />
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    fill: {
      flex: 1,
      justifyContent: 'center' as const,
      alignSelf: 'stretch' as const,
    },
    iconWrap: {
      width: components.touchTarget + spacing.group,
      height: components.touchTarget + spacing.group,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    title: {
      ...typography.headline,
      color: colors.text,
      textAlign: 'center' as const,
    },
    description: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
  }));
}
