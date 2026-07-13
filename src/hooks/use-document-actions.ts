import * as MailComposer from 'expo-mail-composer';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { useCompanyProfile } from '@/hooks/use-company-profile';
import { useSettings } from '@/hooks/use-settings';
import { triggerImpactHaptic } from '@/lib/haptics';
import { composeDocumentEmail, MailComposerError } from '@/lib/email/composer';
import { buildEmailTemplate } from '@/lib/email/templates';
import { getCachedPdf, setCachedPdf } from '@/lib/pdf/document-cache';
import { generateHtmlAsPdf, printPdf, sharePdf, type GeneratedPdf } from '@/lib/pdf/share';
import { sentDocumentsQueryKeys } from '@/lib/supabase/query-keys';
import { useToast } from '@/providers/toast-provider';
import type { SentDocumentType } from '@/types/sent-document';

type UseDocumentActionsOptions = {
  documentType: SentDocumentType;
  documentId: string;
  documentNumber: string;
  clientEmail?: string | null;
  clientName: string;
  buildHtml: (templateId?: string) => Promise<string>;
};

export function useDocumentActions({
  documentType,
  documentId,
  documentNumber,
  clientEmail,
  clientName,
  buildHtml,
}: UseDocumentActionsOptions) {
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

  const applyTemplate = useCallback((nextTemplateId: string) => {
    setTemplateId(nextTemplateId);
    activePdfRef.current = null;
    setPreviewPdfUri(null);
  }, []);

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

  const handleOpenPreview = useCallback(async () => {
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
  }, [loadPreviewPdf, showError]);

  const exportCachedPdf = useCallback(
    async (dialogTitle: string) => {
      const pdf = activePdfRef.current ?? (await ensurePdf());
      if (!pdf?.uri) {
        throw new Error('PDF unavailable.');
      }
      await sharePdf(pdf.uri, dialogTitle);
      return pdf;
    },
    [ensurePdf],
  );

  const handleShare = useCallback(async () => {
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
  }, [documentNumber, documentType, ensurePdf, exportCachedPdf, showError, showSuccess]);

  const handlePrint = useCallback(async () => {
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
  }, [ensurePdf, showError]);

  const handleSendEmail = useCallback(async () => {
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
  }, [
    clientEmail,
    clientName,
    companyProfile?.companyName,
    documentId,
    documentNumber,
    documentType,
    ensurePdf,
    queryClient,
    showError,
    showSuccess,
    user?.id,
  ]);

  return {
    templateId,
    applyTemplate,
    previewVisible,
    setPreviewVisible,
    previewPdfUri,
    pageCount,
    setPageCount,
    loading,
    pdfLoading,
    emailLoading,
    handleOpenPreview,
    handleShare,
    handlePrint,
    handleSendEmail,
    buildPreviewHtml: (id: string) => buildHtml(id),
  };
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
