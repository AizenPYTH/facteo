import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { BlurredTeaser } from '@/components/ui/blurred-teaser';
import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatCurrency } from '@/lib/format/currency';
import { springs } from '@/lib/motion/springs';
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
            {data.map((item, index) => {
              const heightPercent = Math.max(
                (item.amount / maxAmount) * 100,
                item.amount > 0 ? 8 : 4,
              );

              return (
                <RevenueBar
                  amount={item.amount}
                  heightPercent={heightPercent}
                  index={index}
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
  index: number;
  heightPercent: number;
  amount: number;
  month: string;
};

/** Grows into place on mount instead of appearing fully formed — draws the
 * eye to the shape of the trend, not just the end state. */
function RevenueBar({ index, heightPercent, amount, month }: RevenueBarProps) {
  const styles = useStyles();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(index * 40, withSpring(heightPercent, springs.gentle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heightPercent, index]);

  const barStyle = useAnimatedStyle(() => ({
    height: `${progress.value}%`,
  }));

  return (
    <View style={styles.barColumn}>
      <Text style={styles.barValue}>{amount > 0 ? formatCurrency(amount) : '—'}</Text>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, barStyle]} />
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
