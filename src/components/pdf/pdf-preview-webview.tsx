import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { buildPdfPreviewSource } from '@/lib/pdf/preview-source';

const VIEWER_BACKGROUND = '#EBEBF0';

type PdfPreviewWebViewProps = {
  pdfUri: string;
  onPageCountChange?: (count: number) => void;
  onGestureActiveChange?: (active: boolean) => void;
  /** Use pdf.js on all platforms for identical page-fit rendering. */
  preferPdfJs?: boolean;
};

type ViewerMessage =
  | { type: 'loaded'; pageCount: number }
  | { type: 'error'; message: string }
  | { type: 'gesture-start' }
  | { type: 'gesture-end' };

export function PdfPreviewWebView({
  pdfUri,
  onPageCountChange,
  onGestureActiveChange,
  preferPdfJs = false,
}: PdfPreviewWebViewProps) {
  const styles = useStyles();
  const [source, setSource] = useState<Awaited<ReturnType<typeof buildPdfPreviewSource>> | null>(
    null,
  );
  const [error, setError] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSource() {
      setError(false);
      setSource(null);
      setWebViewLoading(true);

      try {
        const nextSource = await buildPdfPreviewSource(pdfUri, { preferPdfJs });

        if (active) {
          setSource(nextSource);
        }
      } catch {
        if (active) {
          setError(true);
          setWebViewLoading(false);
        }
      }
    }

    void loadSource();

    return () => {
      active = false;
    };
  }, [pdfUri, preferPdfJs]);

  function handleMessage(rawMessage: string) {
    try {
      const payload = JSON.parse(rawMessage) as ViewerMessage;

      if (payload.type === 'loaded') {
        setWebViewLoading(false);
        onPageCountChange?.(payload.pageCount);
        return;
      }

      if (payload.type === 'gesture-start') {
        onGestureActiveChange?.(true);
        return;
      }

      if (payload.type === 'gesture-end') {
        onGestureActiveChange?.(false);
        return;
      }

      if (payload.type === 'error') {
        setError(true);
        setWebViewLoading(false);
      }
    } catch {
      // Ignore non-JSON messages from WebView.
    }
  }

  if (error) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Impossible d’afficher l’aperçu PDF.</Text>
      </View>
    );
  }

  if (!source) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={styles.loaderColor.color} size="small" />
        <Text style={styles.emptyText}>Préparation du document…</Text>
      </View>
    );
  }

  const isNative = source.mode === 'native';

  return (
    <View style={styles.container}>
      <WebView
        key={pdfUri}
        allowFileAccess
        allowsBackForwardNavigationGestures={false}
        allowsInlineMediaPlayback
        allowingReadAccessToURL={source.allowingReadAccessToURL}
        bounces
        cacheEnabled
        decelerationRate="normal"
        javaScriptEnabled={!isNative}
        nestedScrollEnabled
        onError={() => {
          setError(true);
          setWebViewLoading(false);
        }}
        onLoadEnd={() => {
          if (isNative) {
            setWebViewLoading(false);
          }
        }}
        onMessage={(event) => {
          handleMessage(event.nativeEvent.data);
        }}
        originWhitelist={['*']}
        scalesPageToFit={false}
        scrollEnabled={isNative}
        setBuiltInZoomControls={false}
        setDisplayZoomControls={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={isNative}
        source={
          source.html
            ? { baseUrl: source.baseUrl, html: source.html }
            : { uri: source.uri ?? pdfUri }
        }
        style={styles.webview}
      />

      {webViewLoading ? (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <ActivityIndicator color={styles.loaderColor.color} size="small" />
        </View>
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: VIEWER_BACKGROUND,
    },
    webview: {
      flex: 1,
      backgroundColor: VIEWER_BACKGROUND,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      padding: spacing.lg,
      backgroundColor: VIEWER_BACKGROUND,
    },
    emptyText: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loaderColor: {
      color: colors.primary,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(235, 235, 240, 0.72)',
    },
  }));
}
