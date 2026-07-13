import { buildQuotePdfHtml } from '@/lib/pdf/document-pdf';
import { generateHtmlAsPdf, sharePdf } from '@/lib/pdf/share';
import type { QuoteDetail } from '@/types/quote';
import type { DataScope } from '@/types/tenant';

export async function shareQuotePdf(
  scope: DataScope,
  quote: QuoteDetail,
  authEmail?: string | null,
): Promise<string> {
  const html = await buildQuotePdfHtml(scope, quote, authEmail);
  const generated = await generateHtmlAsPdf(html, `${quote.number}.pdf`);
  await sharePdf(generated.uri, `Partager le devis ${quote.number}`);
  return generated.uri;
}

export async function previewQuotePdfHtml(
  scope: DataScope,
  quote: QuoteDetail,
  authEmail?: string | null,
): Promise<string> {
  return buildQuotePdfHtml(scope, quote, authEmail);
}

export async function generateQuotePdfFile(
  scope: DataScope,
  quote: QuoteDetail,
  authEmail?: string | null,
): Promise<{ uri: string; html: string }> {
  const html = await buildQuotePdfHtml(scope, quote, authEmail);
  const generated = await generateHtmlAsPdf(html, `${quote.number}.pdf`);
  return { uri: generated.uri, html };
}
