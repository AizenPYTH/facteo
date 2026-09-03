import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { KEYBOARD_TOOLBAR_HEIGHT } from '@/components/ui/keyboard/constants';
import { useKeyboardAwareFooterPadding } from '@/components/ui/keyboard/use-keyboard-footer-padding';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';

export const STICKY_FOOTER_MIN_HEIGHT = 56;
export const STICKY_FOOTER_TOOLBAR_HEIGHT = 48;

type StickyFooterVariant = 'default' | 'toolbar';

type StickyFooterProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  transparent?: boolean;
  variant?: StickyFooterVariant;
  /**
   * Hauteur réelle du pied, mesurée au layout. Un pied dont le contenu varie
   * (récapitulatif dépliable, second bouton) ne peut pas être réservé par une
   * constante : l'écran s'abonne à sa hauteur.
   */
  onHeightChange?: (height: number) => void;
};

/**
 * Espace à réserver sous le contenu scrollable pour qu’il ne passe pas
 * sous le pied + la toolbar clavier.
 */
export function useStickyFooterInset(variant: StickyFooterVariant = 'default'): number {
  const paddingBottom = useKeyboardAwareFooterPadding();
  const contentHeight = variant === 'toolbar' ? STICKY_FOOTER_TOOLBAR_HEIGHT : STICKY_FOOTER_MIN_HEIGHT;
  const topPadding = variant === 'toolbar' ? spacing.xs : spacing.sm;

  return contentHeight + topPadding + paddingBottom + StyleSheet.hairlineWidth + KEYBOARD_TOOLBAR_HEIGHT;
}

export function StickyFooter({
  children,
  style,
  transparent = false,
  variant = 'default',
  onHeightChange,
}: StickyFooterProps) {
  const styles = useStyles(variant);
  const colors = useColors();
  const paddingBottom = useKeyboardAwareFooterPadding();
  const isToolbar = variant === 'toolbar';

  return (
    <KeyboardStickyView offset={{ closed: 0, opened: KEYBOARD_TOOLBAR_HEIGHT }}>
      <View
        onLayout={
          onHeightChange
            ? (event) => onHeightChange(event.nativeEvent.layout.height)
            : undefined
        }
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
    </KeyboardStickyView>
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
