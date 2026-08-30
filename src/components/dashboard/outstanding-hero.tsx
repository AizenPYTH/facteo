import { Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatCurrency, formatSpokenEuros } from '@/lib/format/currency';
import type { DashboardStats } from '@/types/dashboard';

type OutstandingHeroProps = {
  stats: DashboardStats;
};

/**
 * Reste à encaisser — DESIGN §5.2
 * Un seul chiffre + barre à 3 segments (retard / ≤7j / à venir).
 */
export function OutstandingHero({ stats }: OutstandingHeroProps) {
  const styles = useStyles();
  const total = Math.max(stats.outstandingAmount, 0);
  const overdue = Math.max(stats.overdueAmount, 0);
  const dueSoon = Math.max(stats.dueSoonAmount, 0);
  const upcoming = Math.max(stats.upcomingAmount, 0);
  const safeTotal = overdue + dueSoon + upcoming || 1;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Reste à encaisser</Text>
      <Text
        accessibilityLabel={`${formatSpokenEuros(total)} à encaisser`}
        style={styles.amount}>
        {formatCurrency(total)}
      </Text>

      <View style={styles.barTrack}>
        {overdue > 0 ? (
          <View
            style={[styles.segment, styles.overdue, { flex: overdue / safeTotal }]}
          />
        ) : null}
        {dueSoon > 0 ? (
          <View
            style={[styles.segment, styles.dueSoon, { flex: dueSoon / safeTotal }]}
          />
        ) : null}
        {upcoming > 0 || total === 0 ? (
          <View
            style={[
              styles.segment,
              styles.upcoming,
              { flex: total === 0 ? 1 : upcoming / safeTotal },
            ]}
          />
        ) : null}
      </View>

      <View style={styles.legend}>
        <LegendDot colorKey="overdue" label="Retard" styles={styles} value={overdue} />
        <LegendDot colorKey="dueSoon" label="Sous 7 jours" styles={styles} value={dueSoon} />
        <LegendDot colorKey="upcoming" label="À venir" styles={styles} value={upcoming} />
      </View>
    </View>
  );
}

function LegendDot({
  label,
  value,
  colorKey,
  styles,
}: {
  label: string;
  value: number;
  colorKey: 'overdue' | 'dueSoon' | 'upcoming';
  styles: ReturnType<typeof useStyles>;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, styles[colorKey]]} />
      <Text style={styles.legendText}>{label}</Text>
      <Text accessibilityLabel={formatSpokenEuros(value)} style={styles.legendValue}>
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.group,
    },
    label: {
      ...typography.groupLabel,
      color: colors.textTertiary,
    },
    amount: {
      ...typography.amountHero,
      color: colors.text,
    },
    barTrack: {
      flexDirection: 'row' as const,
      height: 8,
      borderRadius: radius.sm,
      overflow: 'hidden' as const,
      backgroundColor: colors.surfaceSecondary,
      gap: 2,
    },
    segment: {
      minWidth: 4,
      borderRadius: radius.xs,
    },
    overdue: {
      backgroundColor: colors.statusOverdue,
    },
    dueSoon: {
      backgroundColor: colors.statusPending,
    },
    upcoming: {
      backgroundColor: colors.statusSent,
    },
    legend: {
      gap: spacing.xs,
    },
    legendItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: radius.full,
    },
    legendText: {
      ...typography.caption1,
      color: colors.textSecondary,
      flex: 1,
    },
    legendValue: {
      ...typography.amount,
      fontSize: 13,
      color: colors.text,
    },
  }));
}
