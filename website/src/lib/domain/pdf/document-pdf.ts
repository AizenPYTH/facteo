import { fetchClientById } from '@/lib/supabase/clients';
import { fetchCompanyById, mapCompanyToFormValues } from '@/lib/supabase/companies';
import { fetchInvoiceById } from '@/lib/supabase/invoices';
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

export async function resolvePdfCompanyInfo(
  scope: DataScope,
  authEmail?: string | null,
): Promise<PdfCompanyInfo> {
  const [company, profileRow] = await Promise.all([
    fetchCompanyById(scope.companyId),
    fetchUserProfile(scope.userId),
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
    legalForm: companyForm.legalForm,
    shareCapital: companyForm.shareCapital,
    rcsCity: companyForm.rcsCity,
    siren: companyForm.siren,
    siret: companyForm.siret,
    vatNumber: companyForm.vatNumber,
    iban: companyForm.iban,
    bic: companyForm.bic,
    paymentMethods: company?.paymentMethods ?? companyForm.paymentMethods,
    logoUrl: company?.logoUrl ?? null,
    signatureUrl: company?.signatureUrl ?? null,
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
    templateId: settings?.quoteTemplateId ?? 'classic-blue',
  };
}

export async function buildInvoicePdfInput(
  scope: DataScope,
  invoice: InvoiceDetail,
  authEmail?: string | null,
): Promise<PdfDocumentInput> {
  const [company, settings, client, documentSignature] = await Promise.all([
    resolvePdfCompanyInfo(scope, authEmail),
    fetchSettings(scope),
    invoice.clientId ? fetchClientById(scope, invoice.clientId) : null,
    fetchDocumentSignature('invoice', invoice.id),
  ]);

  let creditOfInvoiceNumber: string | null = null;
  if (invoice.documentKind === 'credit_note' && invoice.creditOfInvoiceId) {
    const source = await fetchInvoiceById(scope, invoice.creditOfInvoiceId);
    creditOfInvoiceNumber = source?.number ?? null;
  }

  return {
    kind: invoice.documentKind === 'credit_note' ? 'credit_note' : 'invoice',
    number: invoice.number,
    issuedAt: invoice.issuedAt ?? invoice.createdAt,
    dueOrValidUntil: invoice.dueAt,
    serviceDate: invoice.serviceDate ?? null,
    creditOfInvoiceNumber,
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
    showPaymentQr: invoice.documentKind !== 'credit_note',
    clientSignature: documentSignature
      ? { url: documentSignature.signatureUrl, signedAt: documentSignature.signedAt }
      : null,
    templateId: settings?.invoiceTemplateId ?? 'classic-blue',
    vatRegime: invoice.vatRegime,
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
