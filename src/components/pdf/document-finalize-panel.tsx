import { SymbolView } from 'expo-symbols';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { PdfPreviewModal } from '@/components/pdf/pdf-preview-modal';
import { TemplateGalleryModal } from '@/components/pdf/template-gallery-modal';
import { ActionTile } from '@/components/ui/action-tile';
import { AppText } from '@/components/ui/app-text';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useDocumentActions } from '@/hooks/use-document-actions';
import { resolvePdfTemplate } from '@/lib/pdf/engine/templates';
import { useSubscription } from '@/hooks/use-subscription';
import type { SentDocumentType } from '@/types/sent-document';

type DocumentFinalizePanelProps = {
  documentType: SentDocumentType;
  documentId: string;
  documentNumber: string;
  clientEmail?: string | null;
  clientName: string;
  documentUpdatedAt?: string | null;
  buildHtml: (templateId?: string) => Promise<string>;
  onSignPress?: () => void;
  signatureLocked?: boolean;
  onMarkAsSent?: () => void;
  canMarkAsSent?: boolean;
  markAsSentLoading?: boolean;
  /** Appelé après un envoi confirmé par le fournisseur d'e-mail. */
  onSent?: () => Promise<void> | void;
};

export function DocumentFinalizePanel({
  documentType,
  documentId,
  documentNumber,
  clientEmail,
  clientName,
  documentUpdatedAt,
  buildHtml,
  onSignPress,
  signatureLocked: signatureLockedProp,
  onMarkAsSent,
  canMarkAsSent = false,
  markAsSentLoading = false,
  onSent,
}: DocumentFinalizePanelProps) {
  const styles = useStyles();
  const colors = useColors();
  const { hasFeature } = useSubscription();
  const signatureLocked = signatureLockedProp ?? !hasFeature('client_signature');
  const [templatePickerVisible, setTemplatePickerVisible] = useState(false);

  const actions = useDocumentActions({
    documentType,
    documentId,
    documentNumber,
    clientEmail,
    clientName,
    documentUpdatedAt,
    buildHtml,
    onSent,
  });

  const template = resolvePdfTemplate(actions.templateId);
  const isGenerating = actions.pdfStatus === 'generating';

  const pdfStatusLabel =
    actions.pdfStatus === 'generating'
      ? 'Génération du PDF…'
      : actions.pdfStatus === 'ready'
        ? 'PDF prêt'
        : actions.pdfStatus === 'error'
          ? (actions.pdfError ?? 'Erreur lors de la génération')
          : `${documentNumber} · modèle ${template.name}`;

  return (
    <SurfaceCard elevated style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="title">Finaliser le document</AppText>
          <AppText
            color={actions.pdfStatus === 'error' ? 'error' : 'secondary'}
            variant="caption">
            {pdfStatusLabel}
          </AppText>
        </View>
        <Pressable
          accessibilityLabel="Changer de modèle"
          accessibilityRole="button"
          onPress={() => setTemplatePickerVisible(true)}
          style={({ pressed }) => [styles.templateButton, pressed && styles.pressed]}>
          <View
            style={[styles.templateSwatch, { backgroundColor: template.accent ?? colors.text }]}
          />
          <AppText variant="caption">Modèle</AppText>
        </Pressable>
      </View>

      <Pressable
        accessibilityLabel="Aperçu du document"
        accessibilityRole="button"
        accessibilityState={{ busy: actions.isBusy('preview') }}
        disabled={actions.busy}
        onPress={actions.handleOpenPreview}
        style={({ pressed }) => [
          styles.previewCard,
          pressed && styles.pressed,
          actions.busy && styles.disabled,
        ]}>
        <View style={[styles.previewAccent, { backgroundColor: template.accent ?? colors.text }]} />
        <View style={styles.previewContent}>
          <AppText medium variant="body">
            {documentNumber}
          </AppText>
          <AppText color="secondary" variant="caption">
            {clientName}
          </AppText>
        </View>
        {actions.isBusy('preview') || isGenerating ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <SymbolView
            name={{ ios: 'doc.richtext', android: 'description', web: 'description' }}
            size={28}
            tintColor={colors.primary}
          />
        )}
      </Pressable>

      <ActionTile
        disabled={actions.busy && !actions.isBusy('email')}
        icon={{ ios: 'paperplane.fill', android: 'send', web: 'send' }}
        loading={actions.isBusy('email')}
        onPress={actions.handleSendEmail}
        subtitle={`Envoi du PDF au client${clientEmail ? ` (${clientEmail})` : ''}`}
        title="Envoyer par e-mail"
        variant="primary"
      />

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <ActionTile
            disabled={actions.busy && !actions.isBusy('download')}
            icon={{ ios: 'arrow.down.circle.fill', android: 'download', web: 'download' }}
            loading={actions.isBusy('download')}
            onPress={actions.handleDownload}
            subtitle={
              actions.canDownloadFile
                ? 'Enregistrer sur l’appareil'
                : 'Via la boîte d’impression'
            }
            title="Télécharger PDF"
          />
        </View>
        <View style={styles.gridItem}>
          <ActionTile
            disabled={actions.busy && !actions.isBusy('share')}
            icon={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
            loading={actions.isBusy('share')}
            onPress={actions.handleShare}
            title="Partager"
          />
        </View>
        <View style={styles.gridItem}>
          <ActionTile
            disabled={actions.busy && !actions.isBusy('print')}
            icon={{ ios: 'printer.fill', android: 'print', web: 'print' }}
            loading={actions.isBusy('print')}
            onPress={actions.handlePrint}
            title="Imprimer"
          />
        </View>
        {onSignPress ? (
          <View style={styles.gridItem}>
            <ActionTile
              icon={{ ios: 'signature', android: 'draw', web: 'draw' }}
              onPress={() => {
                if (signatureLocked) {
                  router.push('/settings/premium' as Href);
                  return;
                }

                onSignPress();
              }}
              subtitle={signatureLocked ? 'Premium' : 'Signature client'}
              title="Faire signer"
            />
          </View>
        ) : null}
        {canMarkAsSent && onMarkAsSent ? (
          <View style={styles.gridItem}>
            <ActionTile
              icon={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
              loading={markAsSentLoading}
              onPress={onMarkAsSent}
              title="Marquer envoyée"
            />
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/settings/templates' as Href)}
        style={({ pressed }) => [styles.settingsLink, pressed && styles.pressed]}>
        <AppText color="secondary" variant="caption">
          Définir un modèle par défaut dans les paramètres
        </AppText>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={14}
          tintColor={colors.textTertiary}
        />
      </Pressable>

      <TemplateGalleryModal
        buildPreviewHtml={actions.buildPreviewHtml}
        cacheKey={`${documentType}-${documentId}`}
        onClose={() => setTemplatePickerVisible(false)}
        onSelect={actions.applyTemplate}
        selectedTemplateId={actions.templateId}
        title={documentType === 'quote' ? 'Modèle du devis' : 'Modèle de la facture'}
        visible={templatePickerVisible}
      />

      <PdfPreviewModal
        busyAction={actions.pendingAction}
        onClose={() => actions.setPreviewVisible(false)}
        onDownload={actions.handleDownload}
        onEmail={actions.handleSendEmail}
        onPageCountChange={actions.setPageCount}
        onPrint={actions.handlePrint}
        onShare={actions.handleShare}
        pageCount={actions.pageCount}
        pdfHtml={actions.previewHtml}
        pdfLoading={actions.pdfStatus === 'generating'}
        pdfUri={actions.previewPdfUri}
        title={`Aperçu · ${documentNumber}`}
        visible={actions.previewVisible}
      />
    </SurfaceCard>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    panel: {
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    templateButton: {
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 12,
      backgroundColor: colors.backgroundGrouped,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    templateSwatch: {
      width: 28,
      height: 6,
      borderRadius: 999,
    },
    previewCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: 16,
      backgroundColor: colors.backgroundGrouped,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    previewAccent: {
      width: 4,
      alignSelf: 'stretch',
      borderRadius: 999,
    },
    previewContent: {
      flex: 1,
      gap: 2,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    gridItem: {
      width: Platform.OS === 'web' ? '31%' : '48%',
      flexGrow: 1,
    },
    settingsLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: spacing.xs,
    },
    pressed: {
      opacity: 0.88,
    },
    disabled: {
      opacity: 0.6,
    },
  }));
