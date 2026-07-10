import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme/colors';
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
};

export function StatCard({
  label,
  value,
  accentColor = colors.primary,
  onPress,
  style,
  testID,
}: StatCardProps) {
  const content = (
    <>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
        testID={testID}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, style]} testID={testID}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  pressed: {
    opacity: 0.92,
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
  },
  value: {
    ...typography.title2,
    color: colors.text,
  },
});
