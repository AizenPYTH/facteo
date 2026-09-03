import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';

export type DocumentListSkeletonProps = {
  /** Nombre de lignes fantômes. Au-delà de six, on remplit sous le pli pour rien. */
  rows?: number;
};

/**
 * Attente d'une liste de documents.
 *
 * Remplace l'indicateur circulaire centré : la liste ne se substitue plus d'un
 * coup à un écran vide, elle se remplit à l'emplacement qu'elle occupera.
 */
export function DocumentListSkeleton({ rows = 5 }: DocumentListSkeletonProps) {
  const styles = useStyles();

  return (
    <View accessibilityLabel="Chargement de la liste" accessibilityRole="progressbar">
      <Card flush variant="surface">
        {Array.from({ length: rows }, (_, index) => (
          <View key={index} style={styles.row}>
            <View style={styles.leading}>
              <View style={styles.titleRow}>
                <Skeleton height={15} width="44%" />
                <Skeleton height={14} rounded="badge" width={62} />
              </View>
              <Skeleton height={13} width="62%" />
              <Skeleton height={11} width="30%" />
            </View>

            <View style={styles.trailing}>
              <Skeleton height={15} width={76} />
              <Skeleton height={11} width={54} />
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

function useStyles() {
  return useThemedStyles(() => ({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing[3],
      minHeight: 72,
    },
    leading: {
      flex: 1,
      minWidth: 0,
      gap: spacing[1.5],
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    trailing: {
      alignItems: 'flex-end',
      gap: spacing[1.5],
    },
  }));
}
