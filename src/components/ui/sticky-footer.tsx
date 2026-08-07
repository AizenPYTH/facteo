import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';

export const STICKY_FOOTER_MIN_HEIGHT = 56;
export const STICKY_FOOTER_TOOLBAR_HEIGHT = 40;

type StickyFooterVariant = 'default' | 'toolbar';

type StickyFooterProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  transparent?: boolean;
  variant?: StickyFooterVariant;
};

/**
 * Hauteur réservée pour le scroll (bouton + safe area bottom).
 * Le footer n’utilise plus KeyboardStickyView : il reste en bas de la
 * KeyboardAvoidingView parente (FormScreen / WizardScreen).
 */
export function useStickyFooterInset(variant: StickyFooterVariant = 'default'): number {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? spacing.sm : spacing.md);
  const contentHeight = variant === 'toolbar' ? STICKY_FOOTER_TOOLBAR_HEIGHT : STICKY_FOOTER_MIN_HEIGHT;
  const topPadding = variant === 'toolbar' ? spacing.xs : spacing.sm;

  return contentHeight + topPadding + paddingBottom + StyleSheet.hairlineWidth;
}

export function StickyFooter({
  children,
  style,
  transparent = false,
  variant = 'default',
}: StickyFooterProps) {
  const styles = useStyles(variant);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? spacing.xs : spacing.md);
  const isToolbar = variant === 'toolbar';

  return (
    <View
      style={[
        styles.footer,
        {
          paddingBottom,
          borderTopColor: transparent || isToolbar ? 'transparent' : colors.separator,
          backgroundColor: transparent || isToolbar ? 'transparent' : colors.surface,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const useStyles = (variant: StickyFooterVariant) =>
  useThemedStyles(() => ({
    footer: {
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingTop: variant === 'toolbar' ? spacing.xs : spacing.sm,
      gap: variant === 'toolbar' ? 0 : spacing.sm,
      borderTopWidth: variant === 'toolbar' ? 0 : StyleSheet.hairlineWidth,
    },
  }));
