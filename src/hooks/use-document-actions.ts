import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { useCompanyProfile } from '@/hooks/use-company-profile';
import { useSettings } from '@/hooks/use-settings';
import { triggerImpactHaptic } from '@/lib/haptics';
import { composeDocumentEmail, MailComposerError } from '@/lib/email/composer';
import { sendDocumentEmail, SendDocumentEmailError } from '@/lib/email/send-document';
import { buildEmailTemplate } from '@/lib/email/templates';
import { buildPdfCacheKey, getCachedPdf, setCachedPdf } from '@/lib/pdf/document-cache';
import {
  canGeneratePdfFile,
  downloadPdf,
  generatePdfFromHtml,
  PdfGenerationError,
  pdfFileStillExists,
  printPdf,
  runExclusive,
  sharePdf,
  type GeneratedPdf,
  type PdfOutcome,
} from '@/lib/pdf/output';
import { sentDocumentsQueryKeys } from '@/lib/supabase/query-keys';
import { useToast } from '@/providers/toast-provider';
import type { SentDocumentType } from '@/types/sent-document';
import { DEFAULT_PDF_TEMPLATE_ID } from '@/lib/pdf/engine/templates/types';

/** Chaque action du document a son propre état : aucune ne peut « bloquer » les autres. */
export type DocumentActionKey = 'preview' | 'download' | 'share' | 'print' | 'email';

export type DocumentPdfStatus = 'idle' | 'generating' | 'ready' | 'error';

type UseDocumentActionsOptions = {
  documentType: SentDocumentType;
  documentId: string;
  documentNumber: string;
  clientEmail?: string | null;
  clientName: string;
  /** Change dès que le document est modifié : invalide le PDF mémorisé. */
  documentUpdatedAt?: string | null;
  buildHtml: (templateId?: string) => Promise<string>;
  /**
   * Appelé uniquement après un envoi **réellement accepté** par le fournisseur.
   * Permet à l'écran de faire avancer le document (brouillon → envoyé).
   * Jamais appelé pour le repli « ouvrir Mail », dont on ignore l'issue.
   */
  onSent?: () => Promise<void> | void;
};

export function useDocumentActions({
  documentType,
  documentId,
  documentNumber,
  clientEmail,
  clientName,
  documentUpdatedAt,
  buildHtml,
  onSent,
}: UseDocumentActionsOptions) {
  const { user } = useAuth();
  const { data: companyProfile } = useCompanyProfile();
  const { data: settings } = useSettings();
  const queryClient = useQueryClient();
  const { showError, showSuccess, showInfo } = useToast();

  const defaultTemplateId =
    documentType === 'quote'
      ? (settings?.quoteTemplateId ?? DEFAULT_PDF_TEMPLATE_ID)
      : (settings?.invoiceTemplateId ?? DEFAULT_PDF_TEMPLATE_ID);

  const [templateId, setTemplateId] = useState(defaultTemplateId);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPdfUri, setPreviewPdfUri] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pendingAction, setPendingAction] = useState<DocumentActionKey | null>(null);
  const [pdfStatus, setPdfStatus] = useState<DocumentPdfStatus>('idle');
  const [pdfError, setPdfError] = useState<string | null>(null);
  const activePdfRef = useRef<GeneratedPdf | null>(null);

  const pdfFileName = `${documentNumber}.pdf`;
  const cacheKey = buildPdfCacheKey({ documentId, templateId, updatedAt: documentUpdatedAt });

  const ensurePdf = useCallback(
    async (force = false): Promise<GeneratedPdf> => {
      if (!force) {
        const cached = getCachedPdf(cacheKey);

        // Le cache système peut avoir été purgé entre deux ouvertures : on ne
        // sert un PDF mémorisé que si le fichier est toujours là. C'est la
        // raison pour laquelle « Partager » ne marchait qu'une fois sur dix.
        if (cached && (await pdfFileStillExists(cached))) {
          activePdfRef.current = cached;
          return cached;
        }
      }

      setPdfStatus('generating');
      setPdfError(null);

      try {
        const html = await buildHtml(templateId);
        const generated = await generatePdfFromHtml(html, pdfFileName);
        const stored = setCachedPdf(cacheKey, generated);
        activePdfRef.current = stored;
        setPdfStatus('ready');
        return stored;
      } catch (error) {
        const message =
          error instanceof PdfGenerationError
            ? error.message
            : 'Impossible de générer le PDF. Réessayez.';
        setPdfStatus('error');
        setPdfError(message);
        throw error instanceof PdfGenerationError ? error : new PdfGenerationError(message);
      }
    },
    [buildHtml, cacheKey, pdfFileName, templateId],
  );

  const applyTemplate = useCallback((nextTemplateId: string) => {
    setTemplateId(nextTemplateId);
    activePdfRef.current = null;
    setPreviewPdfUri(null);
    setPreviewHtml(null);
    setPdfStatus('idle');
    setPdfError(null);
  }, []);

  /**
   * Exécute une action en garantissant : un seul déclenchement à la fois
   * (double appui neutralisé), un état `pending` visible, et un message final
   * qui distingue succès, annulation et indisponibilité.
   */
  const run = useCallback(
    (key: DocumentActionKey, task: () => Promise<PdfOutcome | void>) => {
      if (pendingAction) {
        return;
      }

      void triggerImpactHaptic();
      setPendingAction(key);

      const started = runExclusive(`${documentId}:${key}`, async () => {
        try {
          return await task();
        } finally {
          setPendingAction(null);
        }
      });

      if (!started) {
        // La même action est déjà en cours pour ce document. Le dire plutôt
        // que de ne rien faire : un bouton muet passe pour une panne.
        setPendingAction(null);
        showInfo('Action déjà en cours, patientez un instant.');
        return;
      }

      void started.catch((error: unknown) => {
        showError(
          error instanceof PdfGenerationError
            ? error.message
            : 'Une erreur est survenue. Réessayez.',
        );
      });
    },
    [documentId, pendingAction, showError, showInfo],
  );

  function reportOutcome(outcome: PdfOutcome | void, successMessage: string) {
    if (!outcome) {
      return;
    }

    if (outcome.status === 'cancelled') {
      // L'utilisateur a fermé la feuille : ce n'est pas une erreur, et surtout
      // on n'affiche pas « réussi ».
      return;
    }

    if (outcome.status === 'unsupported') {
      showInfo(outcome.message);
      return;
    }

    showSuccess(outcome.message ?? successMessage);
  }

  const handleOpenPreview = useCallback(() => {
    run('preview', async () => {
      setPreviewVisible(true);

      try {
        const generated = await ensurePdf();
        setPreviewPdfUri(generated.uri);
        setPreviewHtml(generated.html);
        setPageCount(generated.numberOfPages);
      } catch (error) {
        setPreviewVisible(false);
        throw error;
      }
    });
  }, [ensurePdf, run]);

  const handleShare = useCallback(() => {
    run('share', async () => {
      const pdf = await ensurePdf();
      const outcome = await sharePdf(
        pdf,
        documentType === 'quote'
          ? `Partager le devis ${documentNumber}`
          : `Partager la facture ${documentNumber}`,
      );
      reportOutcome(outcome, 'PDF prêt à partager.');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reportOutcome est stable via les setters du toast
  }, [documentNumber, documentType, ensurePdf, run]);

  const handleDownload = useCallback(() => {
    run('download', async () => {
      const pdf = await ensurePdf();
      const outcome = await downloadPdf(pdf);
      reportOutcome(outcome, `${documentNumber}.pdf enregistré.`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reportOutcome est stable via les setters du toast
  }, [documentNumber, ensurePdf, run]);

  const handlePrint = useCallback(() => {
    run('print', async () => {
      const pdf = await ensurePdf();
      const outcome = await printPdf(pdf);
      reportOutcome(outcome, 'Document envoyé à l’impression.');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reportOutcome est stable via les setters du toast
  }, [ensurePdf, run]);

  /**
   * Repli explicite : ouvre l'application Mail de l'appareil, avec le PDF joint.
   * Ce n'est jamais annoncé comme un envoi INVEQ réussi — l'utilisateur doit
   * encore appuyer sur « Envoyer » dans son application.
   */
  const openMailFallback = useCallback(
    async (generated: GeneratedPdf) => {
      if (!user?.id || !generated.uri) {
        return;
      }

      const template = buildEmailTemplate({
        documentType,
        documentNumber,
        clientName,
        companyName: companyProfile?.companyName,
      });

      try {
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

        showInfo('Application Mail ouverte. Appuyez sur « Envoyer » pour transmettre le document.');
        await queryClient.invalidateQueries({
          queryKey: sentDocumentsQueryKeys.forDocument(user.id, documentType, documentId),
        });
      } catch (error) {
        showError(readEmailErrorMessage(error));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers de toast stables
    [
      clientEmail,
      clientName,
      companyProfile?.companyName,
      documentId,
      documentNumber,
      documentType,
      queryClient,
      user?.id,
    ],
  );

  function proposeMailFallback(generated: GeneratedPdf, reason: string) {
    if (Platform.OS === 'web' || !generated.uri) {
      showError(`${reason} Réessayez plus tard.`);
      return;
    }

    Alert.alert(
      'Envoi automatique impossible',
      `${reason}\n\nVoulez-vous ouvrir votre application Mail pour envoyer ${
        documentType === 'quote' ? 'le devis' : 'la facture'
      } ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Ouvrir Mail', onPress: () => void openMailFallback(generated) },
      ],
    );
  }

  /**
   * Envoi réel : le PDF part du serveur (Resend, expéditeur `factures@inveq.fr`).
   * « Envoyée » ne s'affiche que si le fournisseur a accepté le message.
   */
  const handleSendEmail = useCallback(() => {
    if (!user?.id) {
      showError('Session expirée. Reconnectez-vous.');
      return;
    }

    run('email', async () => {
      const generated = await ensurePdf();

      if (!generated.uri) {
        showInfo('L’envoi du document nécessite l’application mobile.');
        return;
      }

      try {
        const result = await sendDocumentEmail({
          documentType,
          documentId,
          pdfUri: generated.uri,
          pdfFileName: generated.fileName,
        });

        showSuccess(
          result.recipientEmail
            ? `${documentType === 'quote' ? 'Devis' : 'Facture'} envoyé${
                documentType === 'quote' ? '' : 'e'
              } à ${result.recipientEmail}.`
            : `${documentType === 'quote' ? 'Devis' : 'Facture'} envoyé${
                documentType === 'quote' ? '' : 'e'
              }.`,
        );

        await onSent?.();
        await queryClient.invalidateQueries({
          queryKey: sentDocumentsQueryKeys.forDocument(user.id, documentType, documentId),
        });
      } catch (error) {
        if (error instanceof SendDocumentEmailError) {
          if (!error.allowsMailFallback) {
            showError(error.message);
            return;
          }

          proposeMailFallback(generated, error.message);
          return;
        }

        throw error;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers de toast stables
  }, [documentId, documentType, ensurePdf, onSent, openMailFallback, queryClient, run, user?.id]);

  return {
    templateId,
    applyTemplate,
    previewVisible,
    setPreviewVisible,
    previewPdfUri,
    previewHtml,
    pageCount,
    setPageCount,
    pendingAction,
    isBusy: (key: DocumentActionKey) => pendingAction === key,
    /** Vrai dès qu'une action est en cours, pour neutraliser les autres boutons. */
    busy: pendingAction !== null,
    pdfStatus,
    pdfError,
    canDownloadFile: canGeneratePdfFile,
    handleOpenPreview,
    handleShare,
    handleDownload,
    handlePrint,
    handleSendEmail,
    buildPreviewHtml: (id: string) => buildHtml(id),
  };
}

export function readEmailErrorMessage(error: unknown): string {
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
