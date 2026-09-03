import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { shadows } from '@/constants/theme/theme';

type SurfaceCardProps = {
  children: ReactNode;
  onPress?: () => void;
  selected?: boolean;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function SurfaceCard({
  children,
  onPress,
  selected = false,
  elevated = false,
  style,
  testID,
}: SurfaceCardProps) {
  const styles = useStyles();
  const colors = useColors();

  const content = (
    <View
      style={[
        styles.card,
        elevated && shadows.card,
        selected && { borderColor: colors.primary, backgroundColor: colors.primarySubtle },
        style,
      ]}
      testID={testID}>
      {children}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <PressableScale accessibilityRole="button" intensity="subtle" onPress={onPress}>
      {content}
    </PressableScale>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.cardPadding,
      gap: spacing.sm,
      ...shadows.xs,
    },
  }));
