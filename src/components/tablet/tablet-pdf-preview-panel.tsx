import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PdfPreviewWebView } from '@/components/pdf/pdf-preview-webview';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { IPAD_PDF_PREVIEW_WIDTH } from '@/components/tablet/ipad-split-shell';
import { spacing } from '@/constants/theme/spacing';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useIsLargeContentSize } from '@/hooks/use-is-large-content-size';

type TabletPdfPreviewPanelProps = {
  title: string;
  pdfUri: string | null;
  loading: boolean;
  onOpen: () => void;
  onRetry: () => void;
  onShare: () => void;
  shareLoading?: boolean;
};

export function TabletPdfPreviewPanel({
  title,
  pdfUri,
  loading,
  onOpen,
  onRetry,
  onShare,
  shareLoading = false,
}: TabletPdfPreviewPanelProps) {
  const styles = useStyles();
  const colors = useColors();
  const isLargeContentSize = useIsLargeContentSize();

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <AppText medium variant="body">
          {title}
        </AppText>
        <AppText color="secondary" variant="caption">
          Aperçu PDF
        </AppText>
      </View>

      <View style={styles.preview}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
            <AppText color="secondary" variant="caption">
              Génération du PDF…
            </AppText>
          </View>
        ) : pdfUri ? (
          <PdfPreviewWebView pdfUri={pdfUri} preferPdfJs />
        ) : (
          <View style={styles.centered}>
            <AppText color="secondary" variant="body">
              Aperçu indisponible.
            </AppText>
            <Button onPress={onRetry} title="Réessayer" variant="tertiary" />
          </View>
        )}
      </View>

      <View style={[styles.actions, isLargeContentSize && styles.actionsLarge]}>
        <Button
          accessibilityLabel="Ouvrir l’aperçu PDF"
          onPress={onOpen}
          style={[styles.action, isLargeContentSize && styles.actionLarge]}
          title="Ouvrir"
          variant="secondary"
        />
        <Button
          accessibilityLabel="Partager le PDF"
          loading={shareLoading}
          onPress={onShare}
          style={[styles.action, isLargeContentSize && styles.actionLarge]}
          title="Partager"
          variant="secondary"
        />
      </View>
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    panel: {
      width: IPAD_PDF_PREVIEW_WIDTH,
      flexShrink: 0,
      minHeight: 0,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: colors.border,
      backgroundColor: colors.surface,
    },
    header: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    preview: {
      flex: 1,
      minHeight: 0,
    },
    centered: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.backgroundSecondary,
    },
    actions: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    actionsLarge: {
      flexDirection: 'column' as const,
    },
    action: {
      flex: 1,
    },
    actionLarge: {
      flex: 0,
      width: '100%' as const,
    },
  }));
