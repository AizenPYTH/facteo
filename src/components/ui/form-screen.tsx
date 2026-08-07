import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

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
 * Formulaire natif iOS :
 * - pas de KeyboardStickyView
 * - pas de footer flottant au-dessus du clavier
 * - le CTA est en bas du contenu scrollable
 * - KeyboardAwareScrollView fait défiler le champ focalisé
 */
export function FormScreen({
  children,
  header,
  footer,
  edges = ['top', 'bottom'],
  scrollable = true,
  transparent = false,
  contentContainerStyle,
  centerContent = false,
  testID,
}: FormScreenProps) {
  const styles = useStyles(transparent);

  const body = (
    <>
      {children}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </>
  );

  return (
    <View style={styles.root} testID={testID}>
      <SafeAreaView edges={edges} style={styles.safeArea}>
        {header ? <View style={styles.header}>{header}</View> : null}

        {scrollable ? (
          <KeyboardAwareScrollView
            bottomOffset={spacing.lg}
            contentContainerStyle={[
              styles.scrollContent,
              centerContent ? styles.scrollContentCentered : null,
              contentContainerStyle,
            ]}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.flex}>
            {body}
          </KeyboardAwareScrollView>
        ) : (
          <View style={styles.flex}>{body}</View>
        )}
      </SafeAreaView>
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
    footer: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      gap: spacing.sm,
      borderTopWidth: transparent ? 0 : StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
  }));
