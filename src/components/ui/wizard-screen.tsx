import { createContext, useContext, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView, useKeyboardState } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StickyFooter, useStickyFooterInset } from '@/components/ui/sticky-footer';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';

/**
 * Réserve à laisser sous un contenu défilant propre à une étape.
 *
 * Les étapes qui gèrent leur propre liste (`bodyScroll="none"`) recalculaient
 * l'inset depuis le gabarit et ignoraient donc le récapitulatif ajouté au pied.
 * Elles lisent maintenant la hauteur réellement mesurée.
 */
const WizardFooterInsetContext = createContext<number | null>(null);

export function useWizardFooterInset(): number {
  const measured = useContext(WizardFooterInsetContext);
  const fallback = useStickyFooterInset('toolbar');
  return measured ?? fallback;
}

type WizardScreenProps = {
  header?: ReactNode;
  children: ReactNode;
  /** Récapitulatif collé au-dessus des actions — reste visible clavier ouvert. */
  summary?: ReactNode;
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
 *
 * La réserve sous le contenu suit la hauteur réellement mesurée du pied : avec
 * un récapitulatif dépliable au-dessus des boutons, la constante de gabarit ne
 * suffisait plus et la dernière ligne passait sous les actions.
 */
export function WizardScreen({
  header,
  children,
  summary,
  footer,
  testID,
  variant = 'mobile',
  bodyScroll = 'aware',
}: WizardScreenProps) {
  const styles = useStyles();
  const isDesktop = variant === 'desktop';
  const fallbackInset = useStickyFooterInset('toolbar');
  const [measuredFooter, setMeasuredFooter] = useState(0);
  const keyboardVisible = useKeyboardState((state) => state.isVisible);

  // Tant que le pied n'a pas été mesuré, on garde l'estimation du gabarit.
  const footerInset = Math.max(measuredFooter, fallbackInset);

  // Clavier fermé, le pied occupe sa place dans la colonne : rien à réserver.
  // Clavier ouvert, il remonte au-dessus du contenu et il faut le compenser —
  // sans quoi le dernier champ passe dessous. Réserver dans les deux cas
  // laissait un vide en bas de l'étape, d'autant plus visible depuis que le
  // récapitulatif a épaissi le pied.
  const scrollReserve = keyboardVisible ? footerInset : spacing.md;

  if (isDesktop) {
    return (
      <View style={styles.desktopRoot} testID={testID}>
        <View style={styles.desktopBody}>{children}</View>
        {summary ? <View style={styles.desktopSummary}>{summary}</View> : null}
        {footer ? <View style={styles.desktopFooter}>{footer}</View> : null}
      </View>
    );
  }

  const hasFooter = Boolean(footer || summary);

  return (
    <WizardFooterInsetContext.Provider value={footerInset}>
      <View style={styles.root} testID={testID}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          {header ? <View style={styles.header}>{header}</View> : null}
          {bodyScroll === 'aware' ? (
            <KeyboardAwareScrollView
              bottomOffset={hasFooter ? footerInset : spacing.md}
              contentContainerStyle={[
                styles.scrollContent,
                hasFooter ? { paddingBottom: scrollReserve } : null,
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
        {hasFooter ? (
          <StickyFooter onHeightChange={setMeasuredFooter} variant="toolbar">
            {summary}
            {footer}
          </StickyFooter>
        ) : null}
      </View>
    </WizardFooterInsetContext.Provider>
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
    desktopSummary: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
    },
    desktopFooter: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
  }));
