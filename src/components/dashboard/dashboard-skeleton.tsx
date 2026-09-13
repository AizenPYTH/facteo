import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';

/**
 * Attente du tableau de bord.
 *
 * Reprend la silhouette exacte de l'écran chargé — carte de tête, deux
 * indicateurs, tuiles d'action, liste — plutôt qu'un indicateur circulaire
 * centré : la page ne saute plus au moment où les données arrivent.
 */
export function DashboardSkeleton() {
  const styles = useStyles();

  return (
    <View accessibilityLabel="Chargement du tableau de bord" style={styles.container}>
      <Card style={styles.hero} variant="elevated">
        <Skeleton height={14} width="42%" />
        <Skeleton height={36} rounded="md" width="68%" />
        <Skeleton height={12} width="34%" />
      </Card>

      <View style={styles.row}>
        <Card style={styles.stat} variant="elevated">
          <Skeleton height={12} width="60%" />
          <Skeleton height={24} rounded="sm" width="80%" />
        </Card>
        <Card style={styles.stat} variant="elevated">
          <Skeleton height={12} width="60%" />
          <Skeleton height={24} rounded="sm" width="80%" />
        </Card>
      </View>

      <View style={styles.row}>
        <Skeleton height={96} rounded="card" style={styles.tile} />
        <Skeleton height={96} rounded="card" style={styles.tile} />
      </View>

      <View style={styles.section}>
        <Skeleton height={20} width="46%" />
        <Card flush variant="surface">
          {[0, 1, 2].map((index) => (
            <View key={index} style={styles.listRow}>
              <Skeleton height={32} rounded="sm" width={32} />
              <View style={styles.listBody}>
                <Skeleton height={14} width="70%" />
                <Skeleton height={11} width="45%" />
              </View>
              <Skeleton height={14} rounded="badge" width={56} />
            </View>
          ))}
        </Card>
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles(() => ({
    container: {
      gap: spacing.sectionGap,
    },
    hero: {
      gap: spacing[3],
      paddingVertical: spacing[5],
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    stat: {
      flex: 1,
      minWidth: 0,
      gap: spacing[2],
    },
    tile: {
      flex: 1,
      minWidth: 0,
      borderRadius: radius.card,
    },
    section: {
      gap: spacing.md,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      minHeight: 52,
      paddingVertical: spacing[2.5],
      paddingHorizontal: spacing.listItemPadding,
    },
    listBody: {
      flex: 1,
      gap: spacing[1.5],
    },
  }));
}
