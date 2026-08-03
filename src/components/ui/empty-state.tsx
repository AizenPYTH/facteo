import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { motion } from '@/constants/theme/design-system';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { fadeInUp } from '@/lib/motion/presets';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: SymbolName;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  testID?: string;
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
  actionLabel,
  onAction,
  style,
  testID,
}: EmptyStateProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={[styles.container, style]} testID={testID}>
      <Animated.View entering={ZoomIn.duration(motion.normal).springify().damping(15).stiffness(180)} style={styles.iconWrap}>
        <SymbolView name={icon} size={28} tintColor={colors.iconTertiary} type="hierarchical" />
      </Animated.View>
      <Animated.View entering={fadeInUp({ index: 1 })} style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </Animated.View>
      {actionLabel && onAction ? (
        <Animated.View entering={fadeInUp({ index: 2 })}>
          <Button accessibilityLabel={actionLabel} onPress={onAction} title={actionLabel} />
        </Animated.View>
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  container: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: spacing.xs,
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
}));
}
