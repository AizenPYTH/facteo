import { renderTemplatedDocumentPdfHtml } from '@/lib/pdf/engine/templates';
import type { PdfDocumentInput } from '@/lib/pdf/engine/types';

export function renderDocumentPdfHtml(input: PdfDocumentInput): string {
  return renderTemplatedDocumentPdfHtml(input);
}
