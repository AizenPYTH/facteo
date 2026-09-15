import { buildTemplateContext } from '@/lib/pdf/engine/templates/context';
import { resolvePdfTemplate } from '@/lib/pdf/engine/templates/registry';
import { PAGE_HEIGHT, PAGE_WIDTH, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfDocumentInput } from '@/lib/pdf/engine/types';

/**
 * Enveloppe A4 commune. Chaque modèle produit le contenu de la page ; c'est ici
 * qu'on fixe le format, la pagination et les règles d'impression.
 *
 * Points structurants :
 * - `min-height` (et non `height`) sur la page : au-delà d'une page le contenu
 *   déborde proprement sur la suivante au lieu d'être coupé, tout en gardant le
 *   pied de page collé en bas quand il n'y en a qu'une (règle du handoff).
 * - `thead { display: table-header-group }` : l'en-tête du tableau de lignes se
 *   répète en haut de chaque page.
 * - Le bloc totaux porte `page-break-inside: avoid` : il bascule entier plutôt
 *   que d'être coupé.
 */
function pageStyles(): string {
  return `
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin:0; padding:0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { width:${u(794)}; }
    img { max-width:100%; }
    table { border-collapse: collapse; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    .dc-page {
      width:${u(794)};
      min-height:${u(1123)};
      display:flex;
      flex-direction:column;
      position:relative;
      overflow:hidden;
    }
    .dc-spacer { flex:1 1 auto; min-height:${u(18)}; }
    .dc-keep { page-break-inside: avoid; }
  `;
}

export function renderTemplatedDocumentPdfHtml(input: PdfDocumentInput): string {
  const template = resolvePdfTemplate(input.templateId);
  const context = buildTemplateContext(input);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=${PAGE_WIDTH}" />
  <title>${context.labels.document} ${context.number}</title>
  <style>${pageStyles()}</style>
</head>
<body style="background:${template.paper}">
${template.render(context)}
</body>
</html>`;
}

export { PAGE_HEIGHT, PAGE_WIDTH };
