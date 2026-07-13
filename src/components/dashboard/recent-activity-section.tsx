import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatDate } from '@/lib/format/date';
import type { ActivityItem } from '@/types/dashboard';

import { SectionHeader } from './section-header';

type RecentActivitySectionProps = {
  activity: ActivityItem[];
  premiumLocked?: boolean;
};

function getActivityIcon(type: ActivityItem['type']) {
  return type === 'invoice'
    ? ({ ios: 'doc.text.fill', android: 'description', web: 'description' } as const)
    : ({ ios: 'doc.plaintext.fill', android: 'article', web: 'article' } as const);
}

export function RecentActivitySection({ activity, premiumLocked = false }: RecentActivitySectionProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.section}>
      <SectionHeader premiumLocked={premiumLocked} title="Activité récente" />
      <View style={[styles.card, premiumLocked ? styles.cardLocked : null]}>
        {activity.length === 0 ? (
          <Text style={styles.empty}>Aucune activité récente.</Text>
        ) : (
          activity.map((item, index) => (
            <View key={`${item.type}-${item.id}`}>
              <View style={styles.row}>
                <View style={styles.iconWrap}>
                  <SymbolView
                    name={getActivityIcon(item.type)}
                    size={18}
                    tintColor={item.type === 'invoice' ? colors.primary : colors.warning}
                    type="hierarchical"
                  />
                </View>
                <View style={styles.content}>
                  <Text numberOfLines={2} style={styles.label}>
                    {item.label}
                  </Text>
                  <Text style={styles.date}>{formatDate(item.date)}</Text>
                </View>
              </View>
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
    overflow: 'hidden',
  },
  cardLocked: {
    opacity: 0.88,
  },
  empty: {
    ...typography.subheadline,
    color: colors.textSecondary,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  date: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: spacing.md + 32 + spacing.md,
  },
}));
}
