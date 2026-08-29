import type { ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type ListRowProps = {
  title: string;
  meta?: string;
  value?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Affiche un chevron à droite (15) — DESIGN §2.6 */
  showChevron?: boolean;
  /** Liseré gauche 3px pour le retard — DESIGN §3.4 */
  overdue?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Ligne de liste — DESIGN §3.4
 * icône/avatar 38 → titre 15/500 + méta 12 → valeur tabulaire → puce/chevron.
 */
export function ListRow({
  title,
  meta,
  value,
  leading,
  trailing,
  showChevron = false,
  overdue = false,
  onPress,
  style,
  accessibilityLabel,
}: ListRowProps) {
  const styles = useStyles();
  const colors = useColors();

  const content = (
    <View style={[styles.row, overdue && styles.overdue, style]}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}

      <View style={styles.body}>
        <Text maxFontSizeMultiplier={1.5} numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {meta ? (
          <Text maxFontSizeMultiplier={1.5} numberOfLines={1} style={styles.meta}>
            {meta}
          </Text>
        ) : null}
      </View>

      {value ? (
        <Text maxFontSizeMultiplier={1.4} style={styles.value}>
          {value}
        </Text>
      ) : null}

      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}

      {showChevron ? (
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={15}
          tintColor={colors.iconTertiary}
        />
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.group,
      paddingVertical: spacing.group,
      paddingHorizontal: spacing.listItemPadding,
      minHeight: components.touchTarget,
      backgroundColor: colors.surface,
    },
    overdue: {
      borderLeftWidth: components.overdueAccentWidth,
      borderLeftColor: colors.statusOverdue,
    },
    leading: {
      width: components.listRowIconSize,
      height: components.listRowIconSize,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    body: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0,
    },
    title: {
      ...typography.headline,
      color: colors.text,
    },
    meta: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    value: {
      ...typography.amount,
      color: colors.text,
    },
    trailing: {
      marginLeft: spacing.xs,
    },
    pressed: {
      opacity: 0.92,
      backgroundColor: colors.surfaceSecondary,
    },
  }));
}
