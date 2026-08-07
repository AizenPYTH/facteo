import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

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

/**
 * Fallback web : iframe + postMessage (react-native-webview n’a pas de cible web).
 */
export function SignaturePad({ loading = false, onExport, onError }: SignaturePadProps) {
  const styles = useStyles();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const { width } = useWindowDimensions();
  const padWidth = Math.max(280, width - 48);
  const padHeight = 220;
  const [ready, setReady] = useState(false);
  const [hasInk, setHasInk] = useState(false);

  const sourceHtml = useMemo(() => buildSignaturePadHtml(padWidth, padHeight), [padHeight, padWidth]);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      try {
        const payload = JSON.parse(String(event.data)) as PadMessage;

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

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  function runPadCommand(command: 'clearPad' | 'exportSignature') {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type: 'command', command }), '*');
    // Direct call when same-origin about:blank / srcdoc
    const win = iframeRef.current?.contentWindow as (Window & {
      clearPad?: () => void;
      exportSignature?: () => void;
    }) | null;
    win?.[command]?.();
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
        <iframe
          ref={iframeRef}
          srcDoc={sourceHtml}
          style={{
            border: '0',
            width: '100%',
            height: '100%',
            display: 'block',
            background: '#FFFFFF',
          }}
          title="Signature"
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
    actions: {
      gap: spacing.xs,
    },
  }));
}
