import { View } from 'react-native';

import { Skeleton, SkeletonCircle } from '@/components/ui/skeleton';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';

/**
 * Mirrors the shape of the loaded dashboard (header, 4 stat cards, quick
 * actions, recent invoices) instead of a generic spinner — the loading state
 * itself should already look like the finished product.
 */
export function DashboardSkeleton() {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Skeleton height={30} width={200} />
          <Skeleton cornerRadius={radius.lg} height={30} width={150} />
        </View>
        <SkeletonCircle size={44} />
      </View>

      <View style={styles.grid}>
        {[0, 1, 2, 3].map((index) => (
          <Skeleton cornerRadius={radius.card} height={92} key={index} style={styles.gridItem} />
        ))}
      </View>

      <View style={styles.row}>
        {[0, 1, 2].map((index) => (
          <Skeleton cornerRadius={radius.card} height={88} key={index} style={styles.tile} />
        ))}
      </View>

      <Skeleton cornerRadius={radius.card} height={200} />
    </View>
  );
}

function useStyles() {
  return useThemedStyles(() => ({
    container: {
      gap: spacing.sectionGap,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    headerText: {
      flex: 1,
      gap: spacing.sm,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    gridItem: {
      flexGrow: 1,
      flexBasis: '46%',
      minWidth: '46%',
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    tile: {
      flex: 1,
    },
  }));
}
