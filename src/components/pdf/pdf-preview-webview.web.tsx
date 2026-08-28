import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { buildPdfPreviewSource } from '@/lib/pdf/preview-source';

const VIEWER_BACKGROUND = '#EBEBF0';

type PdfPreviewWebViewProps = {
  pdfUri: string;
  onPageCountChange?: (count: number) => void;
  onGestureActiveChange?: (active: boolean) => void;
  preferPdfJs?: boolean;
};

/**
 * Web : iframe (react-native-webview n’a pas de cible web).
 */
export function PdfPreviewWebView({
  pdfUri,
  onPageCountChange,
  preferPdfJs = false,
}: PdfPreviewWebViewProps) {
  const styles = useStyles();
  const [source, setSource] = useState<Awaited<ReturnType<typeof buildPdfPreviewSource>> | null>(
    null,
  );
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSource() {
      setError(false);
      setSource(null);
      setLoading(true);

      try {
        const nextSource = await buildPdfPreviewSource(pdfUri, { preferPdfJs });
        if (active) {
          setSource(nextSource);
          setLoading(false);
          onPageCountChange?.(1);
        }
      } catch {
        if (active) {
          setError(true);
          setLoading(false);
        }
      }
    }

    void loadSource();
    return () => {
      active = false;
    };
  }, [onPageCountChange, pdfUri, preferPdfJs]);

  if (error) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Impossible d’afficher l’aperçu PDF.</Text>
      </View>
    );
  }

  if (!source || loading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={styles.loaderColor.color} size="small" />
        <Text style={styles.emptyText}>Préparation du document…</Text>
      </View>
    );
  }

  const iframeSrc = source.html
    ? undefined
    : source.uri ?? (pdfUri.startsWith('html:') ? pdfUri.slice('html:'.length) : pdfUri);

  return (
    <View style={styles.container}>
      <iframe
        src={iframeSrc}
        srcDoc={source.html}
        style={{
          border: '0',
          width: '100%',
          height: '100%',
          background: VIEWER_BACKGROUND,
          display: 'block',
        }}
        title="Aperçu PDF"
      />
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: VIEWER_BACKGROUND,
      minHeight: 320,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      padding: spacing.lg,
      backgroundColor: VIEWER_BACKGROUND,
      minHeight: 320,
    },
    emptyText: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loaderColor: {
      color: colors.primary,
    },
  }));
}
