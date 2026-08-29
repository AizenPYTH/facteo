import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { shadows } from '@/constants/theme/theme';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  selected?: boolean;
  /**
   * @deprecated DESIGN §2.5 : repos = bordure seule, pas d'ombre.
   * Conservé no-op pour les call sites existants.
   */
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
};

/**
 * Carte — DESIGN §2.5 / §3.4
 * Surface, r 14, bordure 1px, élévation repos (pas d'ombre).
 */
export function Card({
  children,
  onPress,
  selected = false,
  elevated: _elevated = false,
  style,
  testID,
  accessibilityLabel,
}: CardProps) {
  const styles = useStyles();
  const colors = useColors();

  const content = (
    <View
      style={[
        styles.card,
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
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

/** @deprecated Prefer `Card`. Alias de migration. */
export const SurfaceCard = Card;

const useStyles = () =>
  useThemedStyles((colors) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.cardPadding,
      gap: spacing.sm,
      ...shadows.rest,
    },
    pressed: {
      opacity: 0.94,
    },
  }));
