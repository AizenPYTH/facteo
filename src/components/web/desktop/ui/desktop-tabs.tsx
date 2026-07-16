import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';

export type DesktopTab = {
  id: string;
  label: string;
  count?: number;
};

type DesktopTabsProps = {
  tabs: DesktopTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
};

export function DesktopTabs({ tabs, activeTab, onTabChange }: DesktopTabsProps) {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const active = tab.id === activeTab;

        return (
          <Pressable
            accessibilityRole="tab"
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            style={active ? styles.tabActive : styles.tab}>
            <Text style={active ? styles.labelActive : styles.label}>{tab.label}</Text>
            {tab.count != null ? (
              <View style={active ? styles.badgeActive : styles.badge}>
                <Text style={active ? styles.badgeTextActive : styles.badgeText}>
                  {tab.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    row: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },
    tabActive: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.primarySubtle,
    },
    label: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    labelActive: {
      ...typography.subheadlineMedium,
      color: colors.primary,
    },
    badge: {
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: radius.full,
      minWidth: 20,
      alignItems: 'center',
    },
    badgeActive: {
      backgroundColor: colors.primary,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: radius.full,
      minWidth: 20,
      alignItems: 'center',
    },
    badgeText: {
      ...typography.caption2,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    badgeTextActive: {
      ...typography.caption2,
      color: colors.onPrimary,
      fontWeight: '600',
    },
  }));
