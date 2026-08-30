import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatDate } from '@/lib/format/date';
import type { ActivityItem } from '@/types/dashboard';

import { SectionHeader } from './section-header';

type RecentActivitySectionProps = {
  activity: ActivityItem[];
};

function getActivityIcon(type: ActivityItem['type']) {
  return type === 'invoice'
    ? ({ ios: 'doc.text.fill', android: 'description', web: 'description' } as const)
    : ({ ios: 'doc.plaintext.fill', android: 'article', web: 'article' } as const);
}

export function RecentActivitySection({ activity }: RecentActivitySectionProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View style={styles.section}>
      <SectionHeader title="Activité récente" />
      <View style={styles.card}>
        {activity.length === 0 ? (
          <Text style={styles.empty}>Aucune activité récente.</Text>
        ) : (
          activity.map((item, index) => (
            <View key={`${item.type}-${item.id}`}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const href =
                    item.type === 'invoice'
                      ? `/documents/invoices/${item.id}`
                      : `/documents/quotes/${item.id}`;
                  router.push(href as Href);
                }}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <View style={styles.iconWrap}>
                  <SymbolView
                    name={getActivityIcon(item.type)}
                    size={18}
                    tintColor={colors.iconSecondary}
                    type="hierarchical"
                  />
                </View>
                <View style={styles.content}>
                  <Text numberOfLines={2} style={styles.label}>
                    {item.label}
                  </Text>
                  <Text style={styles.date}>{formatDate(item.date)}</Text>
                </View>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  size={15}
                  tintColor={colors.iconTertiary}
                />
              </Pressable>
              {index < activity.length - 1 ? <View style={styles.separator} /> : null}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    section: {
      gap: spacing.md,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden' as const,
    },
    empty: {
      ...typography.subheadline,
      color: colors.textSecondary,
      padding: spacing.md,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.group,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.group,
      minHeight: components.touchTarget,
    },
    pressed: {
      backgroundColor: colors.surfaceSecondary,
    },
    iconWrap: {
      width: components.listRowIconSize,
      height: components.listRowIconSize,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    content: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    label: {
      ...typography.headline,
      color: colors.text,
    },
    date: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    separator: {
      height: 1,
      backgroundColor: colors.separator,
      marginLeft: spacing.md + components.listRowIconSize + spacing.group,
    },
  }));
}
