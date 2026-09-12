import { buildInvoicePdfHtml } from '@/lib/pdf/document-pdf';
import { generatePdfFromHtml, sharePdf, type GeneratedPdf, type PdfOutcome } from '@/lib/pdf/output';
import type { InvoiceDetail } from '@/types/invoice';
import type { DataScope } from '@/types/tenant';

export async function generateInvoicePdf(
  scope: DataScope,
  invoice: InvoiceDetail,
  authEmail?: string | null,
  templateId?: string | null,
): Promise<GeneratedPdf> {
  const html = await buildInvoicePdfHtml(scope, invoice, authEmail, templateId);
  return generatePdfFromHtml(html, `${invoice.number}.pdf`);
}

export async function shareInvoicePdf(
  scope: DataScope,
  invoice: InvoiceDetail,
  authEmail?: string | null,
): Promise<PdfOutcome> {
  const generated = await generateInvoicePdf(scope, invoice, authEmail);
  return sharePdf(generated, `Partager la facture ${invoice.number}`);
}

export async function previewInvoicePdfHtml(
  scope: DataScope,
  invoice: InvoiceDetail,
  authEmail?: string | null,
): Promise<string> {
  return buildInvoicePdfHtml(scope, invoice, authEmail);
}
