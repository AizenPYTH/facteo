import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PdfPreviewWebView } from '@/components/pdf/pdf-preview-webview';
import { DesktopPanel } from '@/components/web/desktop/desktop-panel';
import {
  DesktopActionButton,
  DesktopBadge,
} from '@/components/web/desktop/ui/desktop-badge';
import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/app-text';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useSentDocuments } from '@/hooks/use-sent-documents';
import { formatDate } from '@/lib/format/date';
import type { SentDocumentType } from '@/types/sent-document';

type DocumentActionsPanelProps = {
  documentType: SentDocumentType;
  documentId: string;
  documentNumber: string;
  onSend: () => void;
  onDownload: () => void;
  onDuplicate: () => void;
  onPayment?: () => void;
  onEdit?: () => void;
  sendLoading?: boolean;
  downloadLoading?: boolean;
  duplicateLoading?: boolean;
  showPayment?: boolean;
};

export function DocumentActionsPanel({
  documentType,
  documentId,
  documentNumber,
  onSend,
  onDownload,
  onDuplicate,
  onPayment,
  onEdit,
  sendLoading = false,
  downloadLoading = false,
  duplicateLoading = false,
  showPayment = false,
}: DocumentActionsPanelProps) {
  const styles = useStyles();
  const colors = useColors();
  const { data: sentDocs = [], isLoading } = useSentDocuments(documentType, documentId);
  const label = documentType === 'invoice' ? 'facture' : 'devis';

  return (
    <DesktopPanel flush subtitle={documentNumber} title="Actions">
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.actions}>
          <DesktopActionButton
            icon={{ ios: 'paperplane', android: 'send', web: 'send' }}
            label="Envoyer par e-mail"
            loading={sendLoading}
            onPress={onSend}
          />
          <DesktopActionButton
            icon={{ ios: 'arrow.down.doc', android: 'download', web: 'download' }}
            label="Télécharger le PDF"
            loading={downloadLoading}
            onPress={onDownload}
          />
          <DesktopActionButton
            icon={{ ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' }}
            label={`Dupliquer le ${label}`}
            loading={duplicateLoading}
            onPress={onDuplicate}
          />
          {showPayment && onPayment ? (
            <DesktopActionButton
              icon={{ ios: 'creditcard', android: 'payments', web: 'payments' }}
              label="Enregistrer un paiement"
              onPress={onPayment}
            />
          ) : null}
          {onEdit ? (
            <DesktopActionButton
              icon={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' }}
              label="Modifier"
              onPress={onEdit}
            />
          ) : null}
        </View>

        <View style={styles.history}>
          <Text style={styles.historyTitle}>Historique d'envoi</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : sentDocs.length === 0 ? (
            <Text style={styles.historyEmpty}>Aucun envoi enregistré.</Text>
          ) : (
            sentDocs.map((doc) => (
              <View key={doc.id} style={styles.historyRow}>
                <SymbolView
                  name={{ ios: 'envelope', android: 'mail', web: 'mail' }}
                  size={14}
                  tintColor={colors.textSecondary}
                  type="hierarchical"
                />
                <View style={styles.historyContent}>
                  <Text numberOfLines={1} style={styles.historyLabel}>
                    {doc.recipientEmail}
                  </Text>
                  <Text style={styles.historyMeta}>{formatDate(doc.sentAt)}</Text>
                </View>
                <DesktopBadge
                  label={doc.status === 'sent' ? 'Envoyé' : doc.status}
                  tone={doc.status === 'sent' ? 'success' : 'default'}
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </DesktopPanel>
  );
}

type DocumentPreviewPanelProps = {
  title: string;
  loading: boolean;
  error: string | null;
  pdfUri: string | null;
  onRetry: () => void;
  emptyMessage?: string;
};

export function DocumentPreviewPanel({
  title,
  loading,
  error,
  pdfUri,
  onRetry,
  emptyMessage = 'Sélectionnez un document pour afficher l’aperçu.',
}: DocumentPreviewPanelProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <DesktopPanel flex={1} flush title={title}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.hint}>Génération du PDF…</Text>
        </View>
      ) : pdfUri ? (
        <View style={styles.preview}>
          <PdfPreviewWebView pdfUri={pdfUri} preferPdfJs />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <AppText color="secondary" variant="body">
            {error}
          </AppText>
          <Button onPress={onRetry} title="Réessayer" variant="ghost" />
        </View>
      ) : (
        <View style={styles.centered}>
          <AppText color="secondary" variant="body">
            {emptyMessage}
          </AppText>
        </View>
      )}
    </DesktopPanel>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    scroll: { flex: 1 },
    actions: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    history: {
      padding: spacing.lg,
      gap: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    historyTitle: {
      ...typography.subheadlineMedium,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    historyEmpty: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    historyContent: { flex: 1, gap: 2, minWidth: 0 },
    historyLabel: { ...typography.caption1, color: colors.text },
    historyMeta: { ...typography.caption2, color: colors.textTertiary },
    preview: { flex: 1, minHeight: 480 },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.xl,
      minHeight: 320,
    },
    hint: { ...typography.caption1, color: colors.textSecondary },
  }));
