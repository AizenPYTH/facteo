import { buildQuotePdfHtml } from '@/lib/pdf/document-pdf';
import { generatePdfFromHtml, sharePdf, type GeneratedPdf, type PdfOutcome } from '@/lib/pdf/output';
import type { QuoteDetail } from '@/types/quote';
import type { DataScope } from '@/types/tenant';

export async function generateQuotePdf(
  scope: DataScope,
  quote: QuoteDetail,
  authEmail?: string | null,
  templateId?: string | null,
): Promise<GeneratedPdf> {
  const html = await buildQuotePdfHtml(scope, quote, authEmail, templateId);
  return generatePdfFromHtml(html, `${quote.number}.pdf`);
}

export async function shareQuotePdf(
  scope: DataScope,
  quote: QuoteDetail,
  authEmail?: string | null,
): Promise<PdfOutcome> {
  const generated = await generateQuotePdf(scope, quote, authEmail);
  return sharePdf(generated, `Partager le devis ${quote.number}`);
}

export async function previewQuotePdfHtml(
  scope: DataScope,
  quote: QuoteDetail,
  authEmail?: string | null,
): Promise<string> {
  return buildQuotePdfHtml(scope, quote, authEmail);
}
