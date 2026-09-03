import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { shadows } from '@/constants/theme/theme';
import { useColors, useThemedStyles } from '@/hooks/use-colors';

export type CardVariant = 'surface' | 'elevated' | 'outlined' | 'subtle';

export type CardProps = {
  children: ReactNode;
  variant?: CardVariant;
  selected?: boolean;
  /** Retire le padding interne pour les cartes qui gèrent leur propre mise en page. */
  flush?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Surface canonique de l'application.
 *
 * Remplace les déclarations `backgroundColor: colors.surface` dispersées dans les
 * écrans : un seul rayon (`radius.card`), une seule bordure, une seule ombre.
 * Toute carte de l'app doit passer par ici.
 */
export function Card({
  children,
  variant = 'surface',
  selected = false,
  flush = false,
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  style,
  testID,
}: CardProps) {
  const styles = useStyles();
  const colors = useColors();

  const composed: StyleProp<ViewStyle> = [
    styles.base,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    variant === 'subtle' && styles.subtle,
    !flush && styles.padded,
    selected && { borderColor: colors.primary, backgroundColor: colors.primarySubtle },
    disabled && styles.disabled,
    style,
  ];

  if (!onPress && !onLongPress) {
    return (
      <View style={composed} testID={testID}>
        {children}
      </View>
    );
  }

  return (
    <PressableScale
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onLongPress={onLongPress}
      onPress={onPress}
      style={composed}
      testID={testID}>
      {children}
    </PressableScale>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    base: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: spacing.sm,
      overflow: 'hidden',
    },
    padded: {
      padding: spacing.cardPadding,
    },
    elevated: {
      ...shadows.card,
      borderColor: 'transparent',
    },
    outlined: {
      backgroundColor: 'transparent',
      borderColor: colors.borderStrong,
    },
    subtle: {
      backgroundColor: colors.backgroundSecondary,
      borderColor: 'transparent',
    },
    disabled: {
      opacity: 0.5,
    },
  }));
