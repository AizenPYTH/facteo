import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import type {
  SentDocument,
  SentDocumentChannel,
  SentDocumentStatus,
  SentDocumentType,
} from '@/types/sent-document';

const SENT_DOCUMENT_COLUMNS =
  'id, document_type, document_id, document_number, recipient_email, subject, message, channel, status, sent_at' as const;

type SentDocumentRow = {
  id: string;
  document_type: SentDocumentType;
  document_id: string;
  document_number: string;
  recipient_email: string;
  subject: string;
  message: string | null;
  channel: SentDocumentChannel;
  status: SentDocumentStatus;
  sent_at: string;
};

function mapRow(row: SentDocumentRow): SentDocument {
  return {
    id: row.id,
    documentType: row.document_type,
    documentId: row.document_id,
    documentNumber: row.document_number,
    recipientEmail: row.recipient_email,
    subject: row.subject,
    message: row.message,
    channel: row.channel,
    status: row.status,
    sentAt: row.sent_at,
  };
}

export async function logSentDocument(input: {
  userId: string;
  documentType: SentDocumentType;
  documentId: string;
  documentNumber: string;
  recipientEmail: string;
  subject: string;
  message?: string | null;
  channel: SentDocumentChannel;
  status: SentDocumentStatus;
  providerMessageId?: string | null;
}): Promise<SentDocument | null> {
  const { data, error } = await supabase
    .from('sent_documents')
    .insert({
      user_id: input.userId,
      document_type: input.documentType,
      document_id: input.documentId,
      document_number: input.documentNumber,
      recipient_email: input.recipientEmail,
      subject: input.subject,
      message: input.message ?? null,
      channel: input.channel,
      status: input.status,
      provider_message_id: input.providerMessageId ?? null,
    })
    .select(SENT_DOCUMENT_COLUMNS)
    .single();

  if (error) {
    logSupabaseError('logSentDocument', error);
    return null;
  }

  return mapRow(data as SentDocumentRow);
}

export async function fetchSentDocuments(
  userId: string,
  limit = 20,
): Promise<SentDocument[]> {
  const { data, error } = await supabase
    .from('sent_documents')
    .select(SENT_DOCUMENT_COLUMNS)
    .eq('user_id', userId)
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error) {
    logSupabaseError('fetchSentDocuments', error);
    return [];
  }

  return (data as SentDocumentRow[] | null)?.map(mapRow) ?? [];
}

export async function fetchSentDocumentsForDocument(
  userId: string,
  documentType: SentDocumentType,
  documentId: string,
): Promise<SentDocument[]> {
  const { data, error } = await supabase
    .from('sent_documents')
    .select(SENT_DOCUMENT_COLUMNS)
    .eq('user_id', userId)
    .eq('document_type', documentType)
    .eq('document_id', documentId)
    .order('sent_at', { ascending: false });

  if (error) {
    logSupabaseError('fetchSentDocumentsForDocument', error);
    return [];
  }

  return (data as SentDocumentRow[] | null)?.map(mapRow) ?? [];
}
