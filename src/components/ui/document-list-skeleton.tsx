import { StyleSheet, View } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { elevation } from '@/constants/theme/surfaces';
import { useThemedStyles } from '@/hooks/use-colors';

/** Skeleton for document lists (quotes / invoices / clients). */
export function DocumentListSkeleton({ rows = 6 }: { rows?: number }) {
  const styles = useStyles();

  return (
    <View
      accessibilityLabel="Chargement"
      style={styles.list}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i}>
          <View style={styles.row}>
            <View style={styles.top}>
              <View style={styles.number} />
              <View style={styles.pill} />
            </View>
            <View style={styles.client} />
            <View style={styles.bottom}>
              <View style={styles.amount} />
              <View style={styles.date} />
            </View>
          </View>
          {i < rows - 1 ? <View style={styles.separator} /> : null}
        </View>
      ))}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => {
    const bone = colors.backgroundSelected;
    return {
      list: {
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        overflow: 'hidden',
        ...elevation[1],
      },
      row: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        gap: spacing[1.5],
      },
      top: {
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
      number: {
        width: '36%',
        height: 16,
        borderRadius: radius.xs,
        backgroundColor: bone,
      },
      pill: {
        width: 64,
        height: 22,
        borderRadius: radius.full,
        backgroundColor: bone,
      },
      client: {
        width: '48%',
        height: 12,
        borderRadius: radius.xs,
        backgroundColor: bone,
      },
      bottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing[0.5],
      },
      amount: {
        width: '32%',
        height: 20,
        borderRadius: radius.xs,
        backgroundColor: bone,
      },
      date: {
        width: '22%',
        height: 12,
        borderRadius: radius.xs,
        backgroundColor: bone,
      },
      separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.separator,
        marginLeft: spacing.md,
      },
    };
  });
}
