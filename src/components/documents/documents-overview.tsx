import { Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type DocumentsOverviewStat = {
  key: string;
  label: string;
  value: number;
  emphasis?: 'default' | 'warning' | 'danger';
};

type DocumentsOverviewProps = {
  stats: DocumentsOverviewStat[];
};

/**
 * Bandeau de synthèse Documents — volume + actions urgentes.
 */
export function DocumentsOverview({ stats }: DocumentsOverviewProps) {
  const styles = useStyles();

  return (
    <View accessibilityRole="summary" style={styles.row}>
      {stats.map((stat) => (
        <View key={stat.key} style={styles.cell}>
          <Text
            style={[
              styles.value,
              stat.emphasis === 'warning' && styles.valueWarning,
              stat.emphasis === 'danger' && styles.valueDanger,
            ]}>
            {stat.value}
          </Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    row: {
      flexDirection: 'row' as const,
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    cell: {
      flex: 1,
      alignItems: 'center' as const,
      gap: 2,
      paddingHorizontal: spacing.xs,
    },
    value: {
      ...typography.title3,
      fontVariant: ['tabular-nums'],
      color: colors.text,
    },
    valueWarning: {
      color: colors.warning,
    },
    valueDanger: {
      color: colors.error,
    },
    label: {
      ...typography.caption2,
      color: colors.textTertiary,
      textAlign: 'center' as const,
    },
  }));
}
