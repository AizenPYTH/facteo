import * as MailComposer from 'expo-mail-composer';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PdfPreviewModal } from '@/components/pdf/pdf-preview-modal';
import { Button } from '@/components/ui/button';
import { spacing } from '@/constants/theme/spacing';
import { useAuth } from '@/hooks/use-auth';
import { useCompanyProfile } from '@/hooks/use-company-profile';
import { triggerImpactHaptic } from '@/lib/haptics';
import { composeDocumentEmail, MailComposerError } from '@/lib/email/composer';
import { buildEmailTemplate } from '@/lib/email/templates';
import { getCachedPdf, setCachedPdf } from '@/lib/pdf/document-cache';
import { generateHtmlAsPdf, printPdf, sharePdf, type GeneratedPdf } from '@/lib/pdf/share';
import { sentDocumentsQueryKeys } from '@/lib/supabase/query-keys';
import { useToast } from '@/providers/toast-provider';
import type { SentDocumentType } from '@/types/sent-document';

type DocumentPdfActionsProps = {
  documentType: SentDocumentType;
  documentId: string;
  documentNumber: string;
  clientEmail?: string | null;
  clientName: string;
  buildHtml: () => Promise<string>;
  shareLabel?: string;
};

export function DocumentPdfActions({
  documentType,
  documentId,
  documentNumber,
  clientEmail,
  clientName,
  buildHtml,
  shareLabel = 'Générer PDF',
}: DocumentPdfActionsProps) {
  const { user } = useAuth();
  const { data: companyProfile } = useCompanyProfile();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToast();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPdfUri, setPreviewPdfUri] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const activePdfRef = useRef<GeneratedPdf | null>(null);
  const pdfFileName = `${documentNumber}.pdf`;

  const ensurePdf = useCallback(
    async (force = false): Promise<GeneratedPdf> => {
      if (!force) {
        const cached = getCachedPdf(documentId);

        if (cached) {
          activePdfRef.current = cached;
          return cached;
        }
      }

      const html = await buildHtml();
      const generated = await generateHtmlAsPdf(html, pdfFileName);
      const stored = setCachedPdf(documentId, generated);
      activePdfRef.current = stored;
      return stored;
    },
    [buildHtml, documentId, pdfFileName],
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
      const template = buildEmailTemplate({
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
        subject: template.subject,
        body: template.body,
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
    <View style={styles.container}>
      <Button loading={loading} onPress={handleOpenPreview} title={shareLabel} />
      <Button loading={emailLoading} onPress={handleSendEmail} title="Envoyer par e-mail" variant="ghost" />

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
    </View>
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

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});
