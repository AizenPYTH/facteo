import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: SymbolName;
};

const DEFAULT_ICON = {
  ios: 'doc.text',
  android: 'description',
  web: 'description',
} as const satisfies SymbolName;

export function EmptyState({
  title,
  description,
  icon = DEFAULT_ICON,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <SymbolView name={icon} size={28} tintColor={colors.iconTertiary} type="hierarchical" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.headline,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    ...typography.subheadline,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
