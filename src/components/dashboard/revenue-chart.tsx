import { StyleSheet, Text, View } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatCurrency } from '@/lib/format/currency';
import type { MonthlyRevenue } from '@/types/dashboard';

import { SectionHeader } from './section-header';

type RevenueChartProps = {
  data: MonthlyRevenue[];
  premiumLocked?: boolean;
};

export function RevenueChart({ data, premiumLocked = false }: RevenueChartProps) {
  const styles = useStyles();
  const colors = useColors();
  const maxAmount = Math.max(...data.map((item) => item.amount), 1);

  return (
    <View style={styles.section}>
      <SectionHeader premiumLocked={premiumLocked} title="Revenus (12 mois)" />
      <View style={[styles.card, premiumLocked ? styles.cardLocked : null]}>
        <View style={styles.chart}>
          {data.map((item) => {
            const heightPercent = Math.max((item.amount / maxAmount) * 100, item.amount > 0 ? 8 : 4);

            return (
              <View key={item.month} style={styles.barColumn}>
                <Text style={styles.barValue}>
                  {item.amount > 0 ? formatCurrency(item.amount) : '—'}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${heightPercent}%` }]} />
                </View>
                <Text style={styles.barLabel}>{item.month}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  section: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  cardLocked: {
    opacity: 0.88,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 180,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  barValue: {
    ...typography.caption2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  barTrack: {
    width: '100%',
    height: 120,
    justifyContent: 'flex-end',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  barLabel: {
    ...typography.caption1,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
}));
}
