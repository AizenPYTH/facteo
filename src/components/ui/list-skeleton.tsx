import { View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';

type ListSkeletonProps = {
  /** Number of placeholder rows — match what a typical first screen holds. */
  rows?: number;
};

/**
 * Card-shaped loading placeholder for list screens (clients, invoices,
 * quotes) — mirrors a two-line row with a trailing value, which is what
 * every one of those cards actually looks like.
 */
export function ListSkeleton({ rows = 6 }: ListSkeletonProps) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.textBlock}>
            <Skeleton height={16} width="55%" />
            <Skeleton height={13} width="35%" />
          </View>
          <Skeleton height={20} width={64} />
        </View>
      ))}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      gap: spacing.sm,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    textBlock: {
      flex: 1,
      gap: spacing.xs,
    },
  }));
}
