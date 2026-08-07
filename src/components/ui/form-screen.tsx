import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
} from 'react-native-keyboard-controller';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { StickyFooter, useStickyFooterInset } from '@/components/ui/sticky-footer';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';

type FormScreenProps = {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  edges?: Edge[];
  scrollable?: boolean;
  transparent?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** When true, keep vertical centering only when keyboard is closed (auth). */
  centerContent?: boolean;
  testID?: string;
};

/**
 * Formulaire global : le footer reste un sibling flex (pas de KeyboardStickyView).
 * KeyboardAvoidingView réduit la colonne → le CTA reste juste au-dessus du clavier
 * sans remonter dans les champs.
 */
export function FormScreen({
  children,
  header,
  footer,
  edges = ['top'],
  scrollable = true,
  transparent = false,
  contentContainerStyle,
  centerContent = false,
  testID,
}: FormScreenProps) {
  const styles = useStyles(transparent);
  const footerInset = useStickyFooterInset();

  return (
    <View style={styles.root} testID={testID}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <SafeAreaView edges={edges} style={styles.safeArea}>
          {header ? <View style={styles.header}>{header}</View> : null}

          {scrollable ? (
            <KeyboardAwareScrollView
              bottomOffset={footer ? footerInset : spacing.md}
              contentContainerStyle={[
                styles.scrollContent,
                centerContent ? styles.scrollContentCentered : null,
                footer ? { paddingBottom: spacing.md } : null,
                contentContainerStyle,
              ]}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.flex}>
              {children}
            </KeyboardAwareScrollView>
          ) : (
            <View style={styles.flex}>{children}</View>
          )}
        </SafeAreaView>

        {footer ? <StickyFooter transparent={transparent}>{footer}</StickyFooter> : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = (transparent: boolean) =>
  useThemedStyles((colors) => ({
    root: {
      flex: 1,
      backgroundColor: transparent ? 'transparent' : colors.backgroundGrouped,
    },
    safeArea: {
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    header: {
      paddingHorizontal: spacing.screenPaddingHorizontal,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    scrollContentCentered: {
      justifyContent: 'flex-start',
      paddingTop: spacing['2xl'],
    },
  }));
