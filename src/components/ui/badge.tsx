import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles, type AppColors } from '@/hooks/use-colors';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md';

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  size?: BadgeSize;
  /** Pastille de couleur devant le libellé — utile pour les statuts en liste. */
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

function toneColors(colors: AppColors, tone: BadgeTone): { bg: string; fg: string } {
  switch (tone) {
    case 'primary':
      return { bg: colors.primarySubtle, fg: colors.primary };
    case 'success':
      return { bg: colors.successSubtle, fg: colors.success };
    case 'warning':
      return { bg: colors.warningSubtle, fg: colors.warning };
    case 'error':
      return { bg: colors.errorSubtle, fg: colors.error };
    case 'info':
      return { bg: colors.infoSubtle, fg: colors.info };
    default:
      return { bg: colors.backgroundSecondary, fg: colors.textSecondary };
  }
}

/**
 * Indicateur d'état compact. Source unique pour les statuts de documents,
 * de paiements et d'abonnement : une seule forme, un seul jeu de tons.
 */
export function Badge({ label, tone = 'neutral', size = 'md', dot = false, style, testID }: BadgeProps) {
  const styles = useStyles();
  const colors = useColors();
  const { bg, fg } = toneColors(colors, tone);

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="text"
      style={[styles.base, size === 'sm' ? styles.sm : styles.md, { backgroundColor: bg }, style]}
      testID={testID}>
      {dot ? <View style={[styles.dot, { backgroundColor: fg }]} /> : null}
      <Text
        maxFontSizeMultiplier={1.4}
        numberOfLines={1}
        style={[size === 'sm' ? styles.labelSm : styles.labelMd, { color: fg }]}>
        {label}
      </Text>
    </View>
  );
}

const useStyles = () =>
  useThemedStyles(() => ({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      borderRadius: radius.badge,
      gap: spacing[1.5],
    },
    sm: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[0.5],
    },
    md: {
      paddingHorizontal: spacing[2.5],
      paddingVertical: spacing[1],
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: radius.full,
    },
    labelSm: {
      ...typography.caption2,
      fontWeight: '600' as const,
    },
    labelMd: {
      ...typography.caption1,
      fontWeight: '600' as const,
    },
  }));
