import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type DesktopStatCardProps = {
  label: string;
  value: string;
  icon?: SymbolName;
  accentColor?: string;
  trend?: string;
  style?: ViewStyle;
};

export function DesktopStatCard({
  label,
  value,
  icon,
  accentColor,
  trend,
  style,
}: DesktopStatCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const accent = accentColor ?? colors.primary;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.top}>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: `${accent}18` }]}>
            <SymbolView name={icon} size={16} tintColor={accent} type="hierarchical" />
          </View>
        ) : null}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {trend ? <Text style={styles.trend}>{trend}</Text> : null}
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    card: {
      flex: 1,
      minWidth: 160,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      flex: 1,
    },
    value: {
      ...typography.title2,
      color: colors.text,
      fontWeight: '700',
    },
    trend: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
  }));
