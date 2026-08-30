import * as MailComposer from 'expo-mail-composer';
import { useQueryClient } from '@tanstack/react-query';
import { SymbolView } from 'expo-symbols';
import { router, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { PdfPreviewModal } from '@/components/pdf/pdf-preview-modal';
import { TemplateGalleryModal } from '@/components/pdf/template-gallery-modal';
import { ActionTile } from '@/components/ui/action-tile';
import { AppText } from '@/components/ui/app-text';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useAuth } from '@/hooks/use-auth';
import { useCompanyProfile } from '@/hooks/use-company-profile';
import { useSettings } from '@/hooks/use-settings';
import { triggerImpactHaptic } from '@/lib/haptics';
import { composeDocumentEmail, MailComposerError } from '@/lib/email/composer';
import { buildEmailTemplate } from '@/lib/email/templates';
import { getCachedPdf, setCachedPdf } from '@/lib/pdf/document-cache';
import { resolvePdfTemplate } from '@/lib/pdf/engine/templates';
import { generateHtmlAsPdf, printPdf, sharePdf, type GeneratedPdf } from '@/lib/pdf/share';
import { sentDocumentsQueryKeys } from '@/lib/supabase/query-keys';
import { useSubscription } from '@/hooks/use-subscription';
import { useToast } from '@/providers/toast-provider';
import type { SentDocumentType } from '@/types/sent-document';

type DocumentFinalizePanelProps = {
  documentType: SentDocumentType;
  documentId: string;
  documentNumber: string;
  clientEmail?: string | null;
  clientName: string;
  buildHtml: (templateId?: string) => Promise<string>;
  onSignPress?: () => void;
  signatureLocked?: boolean;
  onMarkAsSent?: () => void;
  canMarkAsSent?: boolean;
  markAsSentLoading?: boolean;
};

export function DocumentFinalizePanel({
  documentType,
  documentId,
  documentNumber,
  clientEmail,
  clientName,
  buildHtml,
  onSignPress,
  signatureLocked: signatureLockedProp,
  onMarkAsSent,
  canMarkAsSent = false,
  markAsSentLoading = false,
}: DocumentFinalizePanelProps) {
  const styles = useStyles();
  const colors = useColors();
  const { hasFeature } = useSubscription();
  const signatureLocked = signatureLockedProp ?? !hasFeature('client_signature');
  const { user } = useAuth();
  const { data: companyProfile } = useCompanyProfile();
  const { data: settings } = useSettings();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToast();

  const defaultTemplateId =
    documentType === 'quote'
      ? (settings?.quoteTemplateId ?? 'classic-blue')
      : (settings?.invoiceTemplateId ?? 'classic-blue');

  const [templateId, setTemplateId] = useState(defaultTemplateId);
  const [templatePickerVisible, setTemplatePickerVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPdfUri, setPreviewPdfUri] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const activePdfRef = useRef<GeneratedPdf | null>(null);
  const pdfFileName = `${documentNumber}.pdf`;
  const template = resolvePdfTemplate(templateId);

  const ensurePdf = useCallback(
    async (force = false): Promise<GeneratedPdf> => {
      if (!force) {
        const cached = getCachedPdf(`${documentId}:${templateId}`);

        if (cached) {
          activePdfRef.current = cached;
          return cached;
        }
      }

      const html = await buildHtml(templateId);
      const generated = await generateHtmlAsPdf(html, pdfFileName);
      const stored = setCachedPdf(`${documentId}:${templateId}`, generated);
      activePdfRef.current = stored;
      return stored;
    },
    [buildHtml, documentId, pdfFileName, templateId],
  );

  const loadPreviewPdf = useCallback(async () => {
    setPdfLoading(true);

    try {
      const generated = await ensurePdf();
      setPreviewPdfUri(generated.uri);
      setPageCount(generated.numberOfPages);
    } finally {
      setPdfLoading(false);
    }
  }, [ensurePdf]);

  async function handleOpenPreview() {
    void triggerImpactHaptic();
    setLoading(true);
    setPreviewVisible(true);

    try {
      await loadPreviewPdf();
    } catch {
      showError('Impossible de préparer l’aperçu PDF.');
      setPreviewVisible(false);
    } finally {
      setLoading(false);
    }
  }

  async function exportCachedPdf(dialogTitle: string) {
    const pdf = activePdfRef.current ?? (await ensurePdf());

    if (!pdf?.uri) {
      throw new Error('PDF unavailable.');
    }

    await sharePdf(pdf.uri, dialogTitle);
    return pdf;
  }

  async function handleShare() {
    void triggerImpactHaptic();
    setLoading(true);

    try {
      await ensurePdf();
      await exportCachedPdf(
        documentType === 'quote'
          ? `Partager le devis ${documentNumber}`
          : `Partager la facture ${documentNumber}`,
      );
      showSuccess('PDF prêt à partager.');
    } catch {
      showError('Impossible de générer le PDF.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    void triggerImpactHaptic();
    setLoading(true);

    try {
      await ensurePdf();
      await exportCachedPdf(
        documentType === 'quote'
          ? `Enregistrer le devis ${documentNumber}`
          : `Enregistrer la facture ${documentNumber}`,
      );
      showSuccess('Choisissez « Enregistrer dans Fichiers » dans le menu.');
    } catch {
      showError('Impossible d’enregistrer le PDF.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePrint() {
    void triggerImpactHaptic();
    setLoading(true);

    try {
      const generated = await ensurePdf();
      await printPdf(generated.uri);
    } catch {
      showError('Impossible d’imprimer le document.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendEmail() {
    if (!user?.id) {
      return;
    }

    void triggerImpactHaptic();
    setEmailLoading(true);

    try {
      const generated = await ensurePdf();
      const templateBody = buildEmailTemplate({
        documentType,
        documentNumber,
        clientName,
        companyName: companyProfile?.companyName,
      });

      await composeDocumentEmail({
        userId: user.id,
        documentType,
        documentId,
        documentNumber,
        recipientEmail: clientEmail ?? '',
        subject: templateBody.subject,
        body: templateBody.body,
        pdfUri: generated.uri,
        pdfFileName: generated.fileName,
      });

      showSuccess('Application Mail ouverte avec le PDF joint.');
      await queryClient.invalidateQueries({
        queryKey: sentDocumentsQueryKeys.forDocument(user.id, documentType, documentId),
      });
    } catch (error) {
      showError(readEmailErrorMessage(error));
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <SurfaceCard style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="title">Finaliser le document</AppText>
          <AppText color="secondary" variant="caption">
            {documentNumber} · modèle {template.name}
          </AppText>
        </View>
        <Pressable
          accessibilityLabel="Changer de modèle"
          onPress={() => setTemplatePickerVisible(true)}
          style={({ pressed }) => [styles.templateButton, pressed && styles.pressed]}>
          <View style={[styles.templateSwatch, { backgroundColor: template.theme.primary }]} />
          <AppText variant="caption">Modèle</AppText>
        </Pressable>
      </View>

      <Pressable
        accessibilityLabel="Aperçu du document"
        accessibilityRole="button"
        onPress={() => void handleOpenPreview()}
        style={({ pressed }) => [styles.previewCard, pressed && styles.pressed]}>
        <View style={[styles.previewAccent, { backgroundColor: template.theme.primary }]} />
        <View style={styles.previewContent}>
          <AppText medium variant="body">{documentNumber}</AppText>
          <AppText color="secondary" variant="caption">
            {clientName}
          </AppText>
        </View>
        {loading || pdfLoading ? (
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
        icon={{ ios: 'paperplane.fill', android: 'send', web: 'send' }}
        loading={emailLoading}
        onPress={() => void handleSendEmail()}
        subtitle="Ouvre Mail avec le PDF joint"
        title="Envoyer par e-mail"
        variant="primary"
      />

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <ActionTile
            icon={{ ios: 'doc.fill', android: 'picture_as_pdf', web: 'picture_as_pdf' }}
            loading={loading}
            onPress={() => void handleShare()}
            subtitle="Partager ou enregistrer"
            title="Générer PDF"
          />
        </View>
        <View style={styles.gridItem}>
          <ActionTile
            icon={{ ios: 'printer.fill', android: 'print', web: 'print' }}
            loading={loading}
            onPress={() => void handlePrint()}
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
        accessibilityLabel="Ouvrir les réglages des modèles"
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
        buildPreviewHtml={(id) => buildHtml(id)}
        cacheKey={`${documentType}-${documentId}`}
        onClose={() => setTemplatePickerVisible(false)}
        onSelect={(nextTemplateId) => {
          setTemplateId(nextTemplateId);
          activePdfRef.current = null;
        }}
        selectedTemplateId={templateId}
        title={documentType === 'quote' ? 'Modèle du devis' : 'Modèle de la facture'}
        visible={templatePickerVisible}
      />

      <PdfPreviewModal
        loading={loading}
        onClose={() => setPreviewVisible(false)}
        onEmail={() => {
          void handleSendEmail();
        }}
        onPageCountChange={setPageCount}
        onPrint={() => {
          void handlePrint();
        }}
        onSave={() => {
          void handleSave();
        }}
        onShare={() => {
          void handleShare();
        }}
        pageCount={pageCount}
        pdfLoading={pdfLoading}
        pdfUri={previewPdfUri}
        title={`Aperçu · ${documentNumber}`}
        visible={previewVisible}
      />
    </SurfaceCard>
  );
}

function readEmailErrorMessage(error: unknown): string {
  if (error instanceof MailComposerError) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: string }).message);

    if (message.includes('recipient')) {
      return 'Ajoutez une adresse e-mail au client.';
    }
  }

  return 'Impossible d’envoyer l’e-mail.';
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
      minHeight: 44,
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
      width: '48%',
      flexGrow: 1,
    },
    settingsLink: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: spacing.xs,
    },
    pressed: {
      opacity: 0.88,
    },
  }));
