import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionBar, useActionBarInset } from '@/components/ui/action-bar';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { shadows } from '@/constants/theme/theme';

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
 * @deprecated Prefer `ActionBar` (DESIGN §3.2). Conservé pour migration des wizards.
 */
export function useStickyFooterInset(variant: StickyFooterVariant = 'default'): number {
  const actionBarInset = useActionBarInset();
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? spacing.sm : spacing.md);

  if (variant === 'default') {
    return actionBarInset;
  }

  return STICKY_FOOTER_TOOLBAR_HEIGHT + spacing.xs + paddingBottom;
}

export function StickyFooter({
  children,
  style,
  transparent = false,
  variant = 'default',
}: StickyFooterProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? spacing.xs : spacing.md);
  const isToolbar = variant === 'toolbar';
  const useActionBarLayout = variant === 'default' && !transparent;

  if (useActionBarLayout) {
    return (
      <ActionBar style={style} transparent={transparent}>
        {children}
      </ActionBar>
    );
  }

  return (
    <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
      <View
        style={[
          styles.footer,
          isToolbar ? styles.toolbar : null,
          !transparent && !isToolbar ? shadows.actionBar : null,
          {
            paddingBottom,
            borderTopColor: transparent || isToolbar ? 'transparent' : colors.border,
            backgroundColor: transparent || isToolbar ? 'transparent' : colors.surface,
          },
          style,
        ]}>
        {children}
      </View>
    </KeyboardStickyView>
  );
}

export { ActionBar, useActionBarInset };

const useStyles = () =>
  useThemedStyles(() => ({
    footer: {
      paddingHorizontal: spacing.actionBarPaddingHorizontal,
      paddingTop: spacing.actionBarPaddingTop,
      gap: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    toolbar: {
      paddingTop: spacing.xs,
      gap: 0,
      borderTopWidth: 0,
    },
  }));
