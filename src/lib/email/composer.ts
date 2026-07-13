import * as MailComposer from 'expo-mail-composer';
import { Platform } from 'react-native';

import { resolveMailAttachmentUri } from '@/lib/pdf/pdf-file';
import { logSentDocument } from '@/lib/supabase/sent-documents';
import type { SentDocumentType } from '@/types/sent-document';

export type ComposeDocumentEmailInput = {
  userId: string;
  documentType: SentDocumentType;
  documentId: string;
  documentNumber: string;
  recipientEmail: string;
  subject: string;
  body: string;
  pdfUri: string;
  pdfFileName: string;
  customMessage?: string;
};

export class MailComposerError extends Error {
  constructor(
    message: string,
    readonly code: 'recipient' | 'unavailable' | 'attachment' | 'compose' | 'unknown',
  ) {
    super(message);
    this.name = 'MailComposerError';
  }
}

export async function composeDocumentEmail(input: ComposeDocumentEmailInput): Promise<void> {
  const recipient = input.recipientEmail.trim();

  if (!recipient) {
    throw new MailComposerError(
      'Ajoutez une adresse e-mail au client pour envoyer le document.',
      'recipient',
    );
  }

  const available = await MailComposer.isAvailableAsync();

  if (!available) {
    throw new MailComposerError(
      Platform.OS === 'ios'
        ? 'Configurez l’app Mail sur cet iPhone pour envoyer des documents.'
        : 'Aucune application mail configurée sur cet appareil.',
      'unavailable',
    );
  }

  let attachmentUri: string;

  try {
    attachmentUri = await resolveMailAttachmentUri(input.pdfUri, input.pdfFileName);
  } catch {
    throw new MailComposerError(
      'Impossible de préparer la pièce jointe PDF.',
      'attachment',
    );
  }

  if (__DEV__) {
    console.log('[FACTEO:mail] compose', {
      recipient,
      attachmentUri,
      pdfUri: input.pdfUri,
      platform: Platform.OS,
    });
  }

  let result: MailComposer.MailComposerResult;

  try {
    result = await MailComposer.composeAsync({
      recipients: [recipient],
      subject: input.subject,
      body: input.body,
      attachments: [attachmentUri],
      isHtml: false,
    });
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message: string }).message)
        : 'Erreur inconnue';

    if (__DEV__) {
      console.log('[FACTEO:mail] composeAsync error', message);
    }

    throw new MailComposerError(
      `Impossible d’ouvrir l’application Mail (${message}).`,
      'compose',
    );
  }

  if (__DEV__) {
    console.log('[FACTEO:mail] result', result.status);
  }

  if (result.status === MailComposer.MailComposerStatus.CANCELLED) {
    return;
  }

  if (result.status === MailComposer.MailComposerStatus.SENT) {
    await logSentDocument({
      userId: input.userId,
      documentType: input.documentType,
      documentId: input.documentId,
      documentNumber: input.documentNumber,
      recipientEmail: recipient,
      subject: input.subject,
      message: input.customMessage ?? input.body,
      channel: 'mail',
      status: 'sent',
    });
  }
}

/** Préparation Resend — à brancher sur une Edge Function Supabase. */
export function getResendEndpoint(): string | null {
  const url = process.env.EXPO_PUBLIC_RESEND_API_URL;
  return url?.trim() || null;
}
