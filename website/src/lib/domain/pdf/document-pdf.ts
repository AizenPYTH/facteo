import { fetchClientById } from '@/lib/supabase/clients';
import { fetchInvoicePdfOptions } from '@/lib/domain/supabase/invoices';
import {
  fetchCompanyById,
  fetchCompanySiren,
  mapCompanyToFormValues,
} from '@/lib/supabase/companies';
import { fetchDocumentSignature } from '@/lib/supabase/subscriptions';
import { fetchUserProfile } from '@/lib/supabase/profiles';
import { fetchSettings } from '@/lib/supabase/settings';
import {
  renderDocumentPdfHtml,
  type PdfClientInfo,
  type PdfCompanyInfo,
  type PdfDocumentInput,
} from '@/lib/pdf/engine';
import { inlinePdfCompanyImages, inlinePdfClientSignature } from '@/lib/pdf/inline-images';
import type { InvoiceDetail } from '@/types/invoice';
import type { QuoteDetail } from '@/types/quote';
import type { DataScope } from '@/types/tenant';
import { DEFAULT_PDF_TEMPLATE_ID } from '@/lib/pdf/engine/templates/types';

export async function resolvePdfCompanyInfo(
  scope: DataScope,
  authEmail?: string | null,
): Promise<PdfCompanyInfo> {
  const [company, profileRow, siren] = await Promise.all([
    fetchCompanyById(scope.companyId),
    fetchUserProfile(scope.userId),
    fetchCompanySiren(scope.companyId),
  ]);

  const companyForm = mapCompanyToFormValues(
    company,
    profileRow?.first_name ?? '',
    profileRow?.last_name ?? '',
    authEmail,
  );

  return {
    companyName: companyForm.companyName,
    firstName: companyForm.firstName,
    lastName: companyForm.lastName,
    email: companyForm.email,
    phone: companyForm.phone,
    address: companyForm.address,
    postalCode: companyForm.postalCode,
    city: companyForm.city,
    country: companyForm.country,
    siret: companyForm.siret,
    vatNumber: companyForm.vatNumber,
    iban: companyForm.iban.trim() || profileRow?.iban?.trim() || '',
    bic: companyForm.bic.trim() || profileRow?.bic?.trim() || '',
    paymentMethods: company?.paymentMethods ?? companyForm.paymentMethods,
    logoUrl: company?.logoUrl ?? null,
    signatureUrl: company?.signatureUrl ?? null,
    siren: siren || null,
  };
}

function fallbackClient(name: string): PdfClientInfo {
  return {
    lastName: '',
    firstName: name,
    company: null,
    email: null,
    phone: null,
    address: null,
    postalCode: null,
    city: null,
    country: null,
    vatNumber: null,
  };
}

export async function buildQuotePdfInput(
  scope: DataScope,
  quote: QuoteDetail,
  authEmail?: string | null,
): Promise<PdfDocumentInput> {
  const [company, settings, client, documentSignature] = await Promise.all([
    resolvePdfCompanyInfo(scope, authEmail),
    fetchSettings(scope),
    quote.clientId ? fetchClientById(scope, quote.clientId) : null,
    fetchDocumentSignature('quote', quote.id),
  ]);

  return {
    kind: 'quote',
    number: quote.number,
    issuedAt: quote.issuedAt ?? quote.createdAt,
    dueOrValidUntil: quote.validUntil,
    notes: quote.notes,
    lines: quote.lines,
    totals: {
      subtotalHt: quote.subtotalHt,
      totalVat: quote.totalVat,
      totalTtc: quote.totalTtc,
    },
    company,
    client: client ?? fallbackClient(quote.clientName),
    settings,
    showPaymentQr: false,
    clientSignature: documentSignature
      ? { url: documentSignature.signatureUrl, signedAt: documentSignature.signedAt }
      : null,
    templateId: settings?.quoteTemplateId ?? DEFAULT_PDF_TEMPLATE_ID,
  };
}

export async function buildInvoicePdfInput(
  scope: DataScope,
  invoice: InvoiceDetail,
  authEmail?: string | null,
): Promise<PdfDocumentInput> {
  const [company, settings, client, documentSignature, pdfOptions] = await Promise.all([
    resolvePdfCompanyInfo(scope, authEmail),
    fetchSettings(scope),
    invoice.clientId ? fetchClientById(scope, invoice.clientId) : null,
    fetchDocumentSignature('invoice', invoice.id),
    fetchInvoicePdfOptions(scope, invoice.id),
  ]);

  return {
    kind: 'invoice',
    number: invoice.number,
    issuedAt: invoice.issuedAt ?? invoice.createdAt,
    dueOrValidUntil: invoice.dueAt,
    notes: invoice.notes,
    lines: invoice.lines,
    totals: {
      subtotalHt: invoice.subtotalHt,
      totalVat: invoice.totalVat,
      totalTtc: invoice.totalTtc,
      amountDue: invoice.amountDue,
    },
    company,
    client: client ?? fallbackClient(invoice.clientName),
    settings,
    // Facture déjà soldée (vente encaissée avant émission) : pas de QR de
    // virement, il ferait payer une seconde fois.
    showPaymentQr: invoice.amountDue > 0,
    clientSignature: documentSignature
      ? { url: documentSignature.signatureUrl, signedAt: documentSignature.signedAt }
      : null,
    templateId: pdfOptions.templateId ?? settings?.invoiceTemplateId ?? DEFAULT_PDF_TEMPLATE_ID,
    // Seul `paidAt` signale le paiement : `status` activerait la pastille du modèle 04.
    paidAt: invoice.status === 'paid' ? (invoice.paidAt ?? invoice.updatedAt) : null,
    documentTitle: pdfOptions.title,
    issuerLegalIds: pdfOptions.legalIds,
    stampColor: pdfOptions.stampColor,
    stampPosition: pdfOptions.stampPosition,
    showIssuerEmail: pdfOptions.showEmail,
  };
}

export async function buildQuotePdfHtml(
  scope: DataScope,
  quote: QuoteDetail,
  authEmail?: string | null,
  templateIdOverride?: string | null,
): Promise<string> {
  const input = await buildQuotePdfInput(scope, quote, authEmail);
  const withImages = {
    ...input,
    templateId: templateIdOverride ?? input.templateId,
    company: await inlinePdfCompanyImages(input.company),
    clientSignature: await inlinePdfClientSignature(input.clientSignature),
  };
  return renderDocumentPdfHtml(withImages);
}

export async function buildInvoicePdfHtml(
  scope: DataScope,
  invoice: InvoiceDetail,
  authEmail?: string | null,
  templateIdOverride?: string | null,
): Promise<string> {
  const input = await buildInvoicePdfInput(scope, invoice, authEmail);
  const withImages = {
    ...input,
    templateId: templateIdOverride ?? input.templateId,
    company: await inlinePdfCompanyImages(input.company),
    clientSignature: await inlinePdfClientSignature(input.clientSignature),
  };
  return renderDocumentPdfHtml(withImages);
}
