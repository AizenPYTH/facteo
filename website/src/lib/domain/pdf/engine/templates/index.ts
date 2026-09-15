export {
  LEGACY_TEMPLATE_IDS,
  PDF_TEMPLATES,
  PDF_TEMPLATE_MAP,
  resolvePdfTemplate,
} from '@/lib/pdf/engine/templates/registry';
export { renderTemplatedDocumentPdfHtml } from '@/lib/pdf/engine/templates/render';
export { DEFAULT_PDF_TEMPLATE_ID } from '@/lib/pdf/engine/templates/types';
export type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
export type { TemplateContext } from '@/lib/pdf/engine/templates/context';
