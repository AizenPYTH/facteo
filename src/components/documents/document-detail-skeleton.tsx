import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';

/**
 * Attente d'un détail de document.
 *
 * Reprend la silhouette de l'écran chargé — en-tête, bloc d'informations,
 * prestations, totaux — au lieu de l'indicateur circulaire centré qui laissait
 * l'écran vide puis basculait d'un coup.
 */
export function DocumentDetailSkeleton() {
  const styles = useStyles();

  return (
    <View
      accessibilityLabel="Chargement du document"
      accessibilityRole="progressbar"
      style={styles.container}>
      <View style={styles.headerBlock}>
        <Skeleton height={30} rounded="sm" width="52%" />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Skeleton height={18} width="34%" />
          <Skeleton height={20} rounded="badge" width={72} />
        </View>
        <Card variant="surface">
          <SkeletonText lineHeight={13} lines={4} />
        </Card>
      </View>

      <View style={styles.section}>
        <Skeleton height={18} width="28%" />
        <Card variant="surface">
          <SkeletonText lineHeight={13} lines={3} />
        </Card>
      </View>

      <View style={styles.section}>
        <Skeleton height={18} width="22%" />
        <Card variant="subtle">
          <SkeletonText lineHeight={13} lines={3} />
        </Card>
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles(() => ({
    container: {
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingTop: spacing.sm,
      gap: spacing.lg,
    },
    headerBlock: {
      paddingVertical: spacing.sm,
    },
    section: {
      gap: spacing.sm,
    },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  }));
}
