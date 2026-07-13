export type SentDocumentType = 'quote' | 'invoice';

export type SentDocumentChannel = 'mail' | 'share' | 'resend';

export type SentDocumentStatus = 'draft' | 'sent' | 'failed';

export type SentDocument = {
  id: string;
  documentType: SentDocumentType;
  documentId: string;
  documentNumber: string;
  recipientEmail: string;
  subject: string;
  message: string | null;
  channel: SentDocumentChannel;
  status: SentDocumentStatus;
  sentAt: string;
};
