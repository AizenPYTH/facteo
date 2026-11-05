import { mapCompanyRow } from '@/lib/supabase/companies';
import { mapClientRowToClient, mapInvoiceDetail, mapQuoteDetail } from '@/lib/supabase/mappers';
import { mapSettingsRow } from '@/lib/supabase/settings';
import {
  assembleInvoicePdfInput,
  assemblePdfCompanyInfo,
  assembleQuotePdfInput,
} from '@/lib/pdf/document-pdf';
import type { PdfDocumentInput } from '@/lib/pdf/engine';
import { parseInvoicePdfOptions } from '@/types/pdf-options';
import type {
  ClientRow,
  InvoiceItemRow,
  InvoicePaymentRow,
  InvoiceWithClient,
  QuoteItemRow,
  QuoteWithClient,
  SettingsRow,
} from '@/types/database';

/**
 * Document ouvert par le client depuis un lien sécurisé (`/d/<jeton>`).
 * Les données viennent de `get_public_document` : seulement ce que le client
 * a le droit de voir (aucune note interne).
 */

export type PublicDocumentType = 'quote' | 'invoice';

export type PublicDocumentStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted'
  | 'paid'
  | 'overdue'
  | 'canceled'
  | 'partially_paid';

export type PublicQuoteAnswer = {
  decision: 'accepted' | 'rejected';
  signerName: string;
  createdAt: string;
  comment: string | null;
  documentHash: string;
};

export type PublicDocument = {
  type: PublicDocumentType;
  number: string;
  companyName: string;
  status: PublicDocumentStatus;
  totalTtc: number;
  amountDue: number | null;
  validUntil: string | null;
  dueAt: string | null;
  canRespond: boolean;
  answer: PublicQuoteAnswer | null;
  paymentLink: string | null;
  linkExpiresAt: string | null;
  pdfInput: PdfDocumentInput;
};

type Payload = {
  document_type: PublicDocumentType;
  document: Record<string, unknown>;
  items: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  effective_status: PublicDocumentStatus;
  can_respond: boolean;
  acceptance: {
    decision: 'accepted' | 'rejected';
    signer_name: string;
    created_at: string;
    comment: string | null;
    document_hash: string;
  } | null;
  payment_link: string | null;
  pdf_options: unknown;
  link_expires_at: string | null;
  company: Record<string, unknown> | null;
  profile: { first_name?: string | null; last_name?: string | null; iban?: string | null; bic?: string | null } | null;
  client: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  signature: { signature_url: string; signed_at: string | null } | null;
};

function toNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Les montants arrivent en texte (numeric JSON) : les mappers attendent des nombres. */
function withNumbers<T extends Record<string, unknown>>(row: T, keys: string[]): T {
  const copy: Record<string, unknown> = { ...row };
  for (const key of keys) {
    if (copy[key] !== null && copy[key] !== undefined) {
      copy[key] = toNumber(copy[key]);
    }
  }
  return copy as T;
}

const DOC_AMOUNTS = ['subtotal_ht', 'total_vat', 'total_ttc', 'total'];
const ITEM_AMOUNTS = ['quantity', 'unit_price', 'vat_rate', 'discount_percent', 'line_total_ht', 'position'];

export function parsePublicDocument(raw: unknown): PublicDocument | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const payload = raw as Payload;
  if (!payload.document || (payload.document_type !== 'quote' && payload.document_type !== 'invoice')) {
    return null;
  }

  const company = payload.company
    ? mapCompanyRow(payload.company as Parameters<typeof mapCompanyRow>[0], 'owner')
    : null;
  const companyInfo = assemblePdfCompanyInfo(
    company,
    payload.profile,
    typeof payload.company?.siren === 'string' ? payload.company.siren : null,
  );
  const settings = payload.settings ? mapSettingsRow(payload.settings as unknown as SettingsRow) : null;
  const client = payload.client ? mapClientRowToClient(payload.client as unknown as ClientRow) : null;
  const signature = payload.signature?.signature_url
    ? {
        signatureUrl: payload.signature.signature_url,
        signedAt: payload.signature.signed_at ?? new Date().toISOString(),
      }
    : null;
  const document = withNumbers(payload.document, DOC_AMOUNTS);
  const items = (payload.items ?? []).map((item) => withNumbers(item, ITEM_AMOUNTS));

  const answer: PublicQuoteAnswer | null = payload.acceptance
    ? {
        decision: payload.acceptance.decision,
        signerName: payload.acceptance.signer_name,
        createdAt: payload.acceptance.created_at,
        comment: payload.acceptance.comment,
        documentHash: payload.acceptance.document_hash,
      }
    : null;

  if (payload.document_type === 'quote') {
    const quote = mapQuoteDetail(
      document as unknown as QuoteWithClient,
      items as unknown as QuoteItemRow[],
    );
    return {
      type: 'quote',
      number: quote.number,
      companyName: companyInfo.companyName,
      status: payload.effective_status,
      totalTtc: quote.totalTtc,
      amountDue: null,
      validUntil: quote.validUntil,
      dueAt: null,
      canRespond: payload.can_respond === true,
      answer,
      paymentLink: null,
      linkExpiresAt: payload.link_expires_at,
      pdfInput: { ...assembleQuotePdfInput(quote, companyInfo, settings, client, signature), status: payload.effective_status },
    };
  }

  const payments = (payload.payments ?? []).map((payment) => withNumbers(payment, ['amount']));
  const invoice = mapInvoiceDetail(
    document as unknown as InvoiceWithClient,
    items as unknown as InvoiceItemRow[],
    payments as unknown as InvoicePaymentRow[],
  );
  return {
    type: 'invoice',
    number: invoice.number,
    companyName: companyInfo.companyName,
    status: payload.effective_status,
    totalTtc: invoice.totalTtc,
    amountDue: invoice.amountDue,
    validUntil: null,
    dueAt: invoice.dueAt,
    canRespond: false,
    answer: null,
    paymentLink: payload.payment_link,
    linkExpiresAt: payload.link_expires_at,
    pdfInput: assembleInvoicePdfInput(
      invoice,
      companyInfo,
      settings,
      client,
      signature,
      parseInvoicePdfOptions(payload.pdf_options),
    ),
  };
}

/** Messages lisibles pour les erreurs renvoyées par la base. */
export function publicDocumentErrorMessage(error: unknown): string {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
  if (message.includes('LINK_EXPIRED')) return 'Ce lien a expiré. Demandez un nouveau lien à votre interlocuteur.';
  if (message.includes('LINK_INVALID')) return 'Ce lien n’est pas valable ou a été désactivé.';
  if (message.includes('QUOTE_ALREADY_ANSWERED')) return 'Ce devis a déjà reçu une réponse.';
  if (message.includes('QUOTE_EXPIRED')) return 'Ce devis n’est plus valable. Demandez un devis à jour.';
  if (message.includes('SIGNER_NAME_REQUIRED')) return 'Indiquez votre nom et prénom.';
  if (message.includes('SIGNER_EMAIL_INVALID')) return 'L’adresse e-mail n’est pas valable.';
  if (message.includes('CONSENT_REQUIRED')) return 'Cochez la case « Bon pour accord » pour accepter le devis.';
  if (message.includes('SIGNATURE_REQUIRED')) return 'Signez dans le cadre avant de valider.';
  if (message.includes('COMMENT_TOO_LONG')) return 'Le commentaire est trop long (2 000 caractères au plus).';
  return 'Une erreur est survenue. Réessayez dans un instant.';
}
