import { StyleSheet, Text, View } from 'react-native';

import { BlurredTeaser } from '@/components/ui/blurred-teaser';
import { useThemedStyles } from '@/hooks/use-colors';
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
  const maxAmount = Math.max(...data.map((item) => item.amount), 1);

  return (
    <View style={styles.section}>
      <SectionHeader premiumLocked={premiumLocked} title="Revenus (12 mois)" />
      <BlurredTeaser active={premiumLocked}>
        <View style={styles.card}>
          <View style={styles.chart}>
            {data.map((item) => {
              const heightPercent = Math.max(
                (item.amount / maxAmount) * 100,
                item.amount > 0 ? 8 : 4,
              );

              return (
                <RevenueBar
                  amount={item.amount}
                  heightPercent={heightPercent}
                  key={item.month}
                  month={item.month}
                />
              );
            })}
          </View>
        </View>
      </BlurredTeaser>
    </View>
  );
}

type RevenueBarProps = {
  heightPercent: number;
  amount: number;
  month: string;
};

function RevenueBar({ heightPercent, amount, month }: RevenueBarProps) {
  const styles = useStyles();

  return (
    <View style={styles.barColumn}>
      <Text style={styles.barValue}>{amount > 0 ? formatCurrency(amount) : '—'}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { height: `${heightPercent}%` }]} />
      </View>
      <Text style={styles.barLabel}>{month}</Text>
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
