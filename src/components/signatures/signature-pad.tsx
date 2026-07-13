import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { Button } from '@/components/ui/button';
import { useThemedStyles } from '@/hooks/use-colors';
import { buildSignaturePadHtml } from '@/components/signatures/signature-pad-html';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';

type SignaturePadProps = {
  loading?: boolean;
  onExport: (dataUri: string) => void;
  onError?: (message: string) => void;
};

type PadMessage =
  | { type: 'ready' }
  | { type: 'cleared' }
  | { type: 'ink' }
  | { type: 'export'; dataUri: string }
  | { type: 'error'; message: string };

export function SignaturePad({ loading = false, onExport, onError }: SignaturePadProps) {
  const styles = useStyles();
  const webViewRef = useRef<WebView>(null);
  const { width } = useWindowDimensions();
  const padWidth = Math.max(280, width - 48);
  const padHeight = 220;

  const [ready, setReady] = useState(false);
  const [hasInk, setHasInk] = useState(false);

  const sourceHtml = buildSignaturePadHtml(padWidth, padHeight);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data) as PadMessage;

        switch (payload.type) {
          case 'ready':
            setReady(true);
            break;
          case 'cleared':
            setHasInk(false);
            break;
          case 'ink':
            setHasInk(true);
            break;
          case 'export':
            setHasInk(true);
            onExport(payload.dataUri);
            break;
          case 'error':
            onError?.(payload.message);
            break;
        }
      } catch {
        // Ignore malformed messages.
      }
    },
    [onError, onExport],
  );

  function runPadCommand(command: 'clearPad' | 'exportSignature') {
    webViewRef.current?.injectJavaScript(`window.${command}(); true;`);
  }

  function handleClear() {
    runPadCommand('clearPad');
    setHasInk(false);
  }

  function handleExport() {
    if (!ready) {
      onError?.('Le pad de signature n’est pas prêt.');
      return;
    }

    runPadCommand('exportSignature');
  }

  return (
    <View style={styles.container}>
      <View style={[styles.pad, { width: padWidth, height: padHeight }]}>
        <WebView
          ref={webViewRef}
          bounces={false}
          nestedScrollEnabled={false}
          onMessage={handleMessage}
          originWhitelist={['*']}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          source={{ html: sourceHtml }}
          style={styles.webview}
        />
      </View>

      <View style={styles.actions}>
        <Button loading={loading} onPress={handleExport} title="Valider la signature" />
        <Button disabled={loading || !hasInk} onPress={handleClear} title="Effacer" variant="ghost" />
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      gap: spacing.sm,
    },
    pad: {
      borderRadius: radius.card,
      overflow: 'hidden',
      backgroundColor: '#FFFFFF',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    webview: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    actions: {
      gap: spacing.sm,
    },
  }));
}
