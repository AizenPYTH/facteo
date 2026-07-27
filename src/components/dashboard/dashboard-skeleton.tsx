import { StyleSheet, View } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { elevation } from '@/constants/theme/surfaces';

/**
 * Structural skeleton for dashboard — perceived speed (P4).
 * Mirrors stats grid + section blocks; no spinner.
 */
export function DashboardSkeleton() {
  const styles = useStyles();

  return (
    <View style={styles.root} accessibilityLabel="Chargement du tableau de bord">
      <View style={styles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.statCard}>
            <View style={styles.lineShort} />
            <View style={styles.lineValue} />
          </View>
        ))}
      </View>
      <View style={styles.block}>
        <View style={styles.lineTitle} />
        <View style={styles.row}>
          <View style={styles.action} />
          <View style={styles.action} />
          <View style={styles.action} />
        </View>
      </View>
      <View style={styles.listBlock}>
        <View style={styles.lineTitle} />
        <View style={styles.listRow} />
        <View style={styles.listRow} />
        <View style={styles.listRow} />
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => {
    const bone = colors.backgroundSelected;
    return {
      root: {
        gap: spacing.sectionGap,
      },
      grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
      },
      statCard: {
        flexGrow: 1,
        flexBasis: '46%',
        minWidth: '46%',
        minHeight: 92,
        borderRadius: radius.card,
        backgroundColor: colors.surface,
        padding: spacing.md,
        gap: spacing.md,
        justifyContent: 'space-between',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        ...elevation[1],
      },
      lineShort: {
        width: '42%',
        height: 12,
        borderRadius: radius.xs,
        backgroundColor: bone,
      },
      lineValue: {
        width: '68%',
        height: 22,
        borderRadius: radius.xs,
        backgroundColor: bone,
      },
      lineTitle: {
        width: '38%',
        height: 16,
        borderRadius: radius.xs,
        backgroundColor: bone,
        marginBottom: spacing.sm,
      },
      block: {
        gap: spacing.md,
      },
      row: {
        flexDirection: 'row',
        gap: spacing.sm,
      },
      action: {
        flex: 1,
        height: 88,
        borderRadius: radius.card,
        backgroundColor: colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        ...elevation[1],
      },
      listBlock: {
        gap: spacing.sm,
      },
      listRow: {
        height: 56,
        borderRadius: radius.card,
        backgroundColor: colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        ...elevation[1],
      },
    };
  });
}
