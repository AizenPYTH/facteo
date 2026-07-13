import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type StatCardProps = {
  label: string;
  value: string;
  accentColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
  premiumLocked?: boolean;
};

export function StatCard({
  label,
  value,
  accentColor,
  onPress,
  style,
  testID,
  premiumLocked = false,
}: StatCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const resolvedAccent = accentColor ?? colors.primary;
  const content = (
    <>
      <View style={[styles.accent, { backgroundColor: resolvedAccent }]} />
      {premiumLocked ? (
        <View style={styles.lockBadge}>
          <SymbolView name="lock.fill" size={11} tintColor={colors.textTertiary} />
        </View>
      ) : null}
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, premiumLocked ? styles.valueLocked : null]}>{value}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          premiumLocked ? styles.cardLocked : null,
          pressed && styles.pressed,
          style,
        ]}
        testID={testID}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, premiumLocked ? styles.cardLocked : null, style]} testID={testID}>
      {content}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardLocked: {
    opacity: 0.88,
  },
  pressed: {
    opacity: 0.92,
  },
  lockBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  label: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    flexShrink: 1,
  },
  value: {
    ...typography.title2,
    color: colors.text,
    flexShrink: 1,
  },
  valueLocked: {
    color: colors.textSecondary,
  },
}));
}
