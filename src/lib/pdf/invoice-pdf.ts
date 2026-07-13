import { buildInvoicePdfHtml } from '@/lib/pdf/document-pdf';
import { generateHtmlAsPdf, sharePdf } from '@/lib/pdf/share';
import type { InvoiceDetail } from '@/types/invoice';
import type { DataScope } from '@/types/tenant';

export async function shareInvoicePdf(
  scope: DataScope,
  invoice: InvoiceDetail,
  authEmail?: string | null,
): Promise<string> {
  const html = await buildInvoicePdfHtml(scope, invoice, authEmail);
  const generated = await generateHtmlAsPdf(html, `${invoice.number}.pdf`);
  await sharePdf(generated.uri, `Partager la facture ${invoice.number}`);
  return generated.uri;
}

export async function previewInvoicePdfHtml(
  scope: DataScope,
  invoice: InvoiceDetail,
  authEmail?: string | null,
): Promise<string> {
  return buildInvoicePdfHtml(scope, invoice, authEmail);
}

export async function generateInvoicePdfFile(
  scope: DataScope,
  invoice: InvoiceDetail,
  authEmail?: string | null,
): Promise<{ uri: string; html: string }> {
  const html = await buildInvoicePdfHtml(scope, invoice, authEmail);
  const generated = await generateHtmlAsPdf(html, `${invoice.number}.pdf`);
  return { uri: generated.uri, html };
}
