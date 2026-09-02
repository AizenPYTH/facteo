import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { StickyFooter, useStickyFooterInset } from '@/components/ui/sticky-footer';
import { KEYBOARD_TOOLBAR_HEIGHT } from '@/components/ui/keyboard/constants';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { radius } from '@/constants/theme/radius';

type KeyboardFormSheetProps = {
  children: ReactNode;
  footer?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Conteneur de formulaire pour les modales / feuilles.
 * Isole la navigation clavier (Prev/Next) au groupe de champs de la feuille.
 */
export function KeyboardFormSheet({
  children,
  footer,
  contentContainerStyle,
  testID,
}: KeyboardFormSheetProps) {
  const styles = useStyles();
  const footerInset = useStickyFooterInset();

  return (
    <View style={styles.root} testID={testID}>
      <KeyboardAwareScrollView
        bottomOffset={footer ? footerInset : spacing.md + KEYBOARD_TOOLBAR_HEIGHT}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.flex}>
        {children}
      </KeyboardAwareScrollView>
      {footer ? <StickyFooter>{footer}</StickyFooter> : null}
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius['2xl'],
      borderTopRightRadius: radius['2xl'],
      overflow: 'hidden',
    },
    flex: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.md,
    },
  }));
