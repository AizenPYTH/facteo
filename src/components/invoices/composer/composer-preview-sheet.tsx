import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ComposerSheet } from '@/components/composer/primitives';
import { PdfPreviewWebView } from '@/components/pdf/pdf-preview-webview';
import {
  composerRadius,
  useComposerColors,
  useComposerStyles,
  type ComposerColors,
} from '@/constants/theme/composer';
import { canGeneratePdfFile, generatePdfFromHtml } from '@/lib/pdf/output';

type PreviewState =
  | { status: 'loading' }
  | { status: 'ready'; pdfUri: string | null; html: string }
  | { status: 'error'; message: string };

type ComposerPreviewSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** HTML du document tel qu'il est saisi (même moteur que le PDF final). */
  buildHtml: () => Promise<string>;
  templateName: string;
  /** Création uniquement : ouvre la galerie des modèles. */
  onChangeTemplate?: () => void;
};

/** Aperçu PDF en feuille, généré à l'ouverture depuis la saisie en cours. */
export function ComposerPreviewSheet({
  visible,
  onClose,
  buildHtml,
  templateName,
  onChangeTemplate,
}: ComposerPreviewSheetProps) {
  const styles = useComposerStyles(previewStyles);
  const colors = useComposerColors();
  const [state, setState] = useState<PreviewState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset before generating a fresh preview
    setState({ status: 'loading' });

    void (async () => {
      try {
        const html = await buildHtml();
        const pdf = canGeneratePdfFile ? await generatePdfFromHtml(html, 'apercu-facture') : null;
        if (!cancelled) {
          setState({ status: 'ready', pdfUri: pdf?.uri ?? null, html });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: 'error',
            message: error instanceof Error && error.message ? error.message : 'Aperçu indisponible.',
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt, buildHtml, visible]);

  return (
    <ComposerSheet closeLabel="OK" onClose={onClose} title="Aperçu" visible={visible}>
      <View style={styles.stage}>
        <View style={styles.paper}>
          {state.status === 'ready' ? (
            <PdfPreviewWebView html={state.html} pdfUri={state.pdfUri} />
          ) : state.status === 'error' ? (
            <View style={styles.center}>
              <Text maxFontSizeMultiplier={1.3} style={styles.errorText}>
                {state.message}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setAttempt((value) => value + 1)}
                style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
                <Text maxFontSizeMultiplier={1.3} style={styles.retryLabel}>
                  Réessayer
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.center}>
              <ActivityIndicator color={colors.accent} />
              <Text maxFontSizeMultiplier={1.3} style={styles.loadingText}>
                Préparation de l’aperçu…
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        {onChangeTemplate ? (
          <Pressable
            accessibilityRole="button"
            onPress={onChangeTemplate}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
            <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.actionLabel}>
              Changer de modèle
            </Text>
            <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.actionMeta}>
              {templateName}
            </Text>
          </Pressable>
        ) : null}
        <View style={[styles.action, styles.liveBadge]}>
          <View style={styles.liveDot} />
          <Text maxFontSizeMultiplier={1.3} style={styles.liveLabel}>
            Reflète la saisie en cours
          </Text>
        </View>
      </View>
    </ComposerSheet>
  );
}

function previewStyles(colors: ComposerColors) {
  return {
    pressed: {
      opacity: 0.6,
    },
    stage: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 4,
    },
    paper: {
      flex: 1,
      borderRadius: 6,
      overflow: 'hidden' as const,
      backgroundColor: colors.paper,
      borderTopWidth: 4,
      borderTopColor: colors.accent,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    center: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 12,
      padding: 24,
    },
    loadingText: {
      fontSize: 14,
      color: '#75737D',
    },
    errorText: {
      fontSize: 15,
      color: '#C93A32',
      textAlign: 'center' as const,
    },
    retry: {
      minHeight: 44,
      paddingHorizontal: 18,
      borderRadius: 12,
      backgroundColor: '#EEEDFC',
      justifyContent: 'center' as const,
    },
    retryLabel: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: '#4338CA',
    },
    actions: {
      flexDirection: 'row' as const,
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 34,
    },
    action: {
      flex: 1,
      minHeight: 52,
      borderRadius: composerRadius.button,
      backgroundColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: 12,
    },
    actionLabel: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.ink,
    },
    actionMeta: {
      fontSize: 12.5,
      color: colors.ink3,
      marginTop: 1,
    },
    liveBadge: {
      flexDirection: 'row' as const,
      gap: 7,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.ok,
    },
    liveLabel: {
      flexShrink: 1,
      fontSize: 14,
      color: colors.ink2,
    },
  };
}
