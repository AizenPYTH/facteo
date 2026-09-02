import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StickyFooter, useStickyFooterInset } from '@/components/ui/sticky-footer';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';

type WizardScreenProps = {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  testID?: string;
  variant?: 'mobile' | 'desktop';
  /** `none` si l’étape gère son propre scroll (liste). */
  bodyScroll?: 'aware' | 'none';
};

/**
 * Assistant devis / facture.
 * Les actions (Suivant / Créer) sont TOUJOURS en pied collé au clavier,
 * jamais dans l’en-tête — c’est ce qui faisait disparaître « Continuer ».
 */
export function WizardScreen({
  header,
  children,
  footer,
  testID,
  variant = 'mobile',
  bodyScroll = 'aware',
}: WizardScreenProps) {
  const styles = useStyles();
  const isDesktop = variant === 'desktop';
  const footerInset = useStickyFooterInset('toolbar');

  if (isDesktop) {
    return (
      <View style={styles.desktopRoot} testID={testID}>
        <View style={styles.desktopBody}>{children}</View>
        {footer ? <View style={styles.desktopFooter}>{footer}</View> : null}
      </View>
    );
  }

  return (
    <View style={styles.root} testID={testID}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {header ? <View style={styles.header}>{header}</View> : null}
        {bodyScroll === 'aware' ? (
          <KeyboardAwareScrollView
            bottomOffset={footer ? footerInset : spacing.md}
            contentContainerStyle={[
              styles.scrollContent,
              footer ? { paddingBottom: footerInset } : null,
            ]}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.flex}>
            {children}
          </KeyboardAwareScrollView>
        ) : (
          <View style={styles.body}>{children}</View>
        )}
      </SafeAreaView>
      {footer ? <StickyFooter variant="toolbar">{footer}</StickyFooter> : null}
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    root: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    safeArea: {
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    header: {
      gap: spacing.md,
    },
    body: {
      flex: 1,
      paddingHorizontal: spacing.screenPaddingHorizontal,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingBottom: spacing.md,
    },
    desktopRoot: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
      minHeight: 0,
    },
    desktopBody: {
      flex: 1,
      minHeight: 0,
    },
    desktopFooter: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
  }));
