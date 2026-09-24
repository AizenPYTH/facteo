import { buildTemplateContext, type TemplateContext } from '@/lib/pdf/engine/templates/context';
import { resolvePdfTemplate } from '@/lib/pdf/engine/templates/registry';
import { escapeHtml, PAGE_HEIGHT, PAGE_WIDTH, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfDocumentInput } from '@/lib/pdf/engine/types';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { STAMP_COLOR_VALUES } from '@/types/pdf-options';

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

const STAMP_GREEN = '#0B7A4B';

/**
 * SIREN / SIRET / TVA choisis pour le document, en tête de page et identiques
 * pour les 20 modèles. Rien n'est rendu si aucun n'est choisi ou renseigné.
 */
function legalIdsStrip(context: TemplateContext): string {
  if (context.issuerLegalIds.length === 0) {
    return '';
  }

  const items = context.issuerLegalIds
    .map(
      (entry) =>
        `<span style="white-space:nowrap"><span style="font-size:${u(8.5)}; letter-spacing:.08em; text-transform:uppercase; color:#8A8A99">${escapeHtml(
          entry.label,
        )}</span>&nbsp;<span style="font-weight:600; color:#3A3A46">${escapeHtml(entry.value)}</span></span>`,
    )
    .join('');

  return `<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:${u(4)} ${u(22)}; padding:${u(11)} ${u(48)} ${u(10)}; font-size:${u(9.5)}; line-height:1.3; border-bottom:1px solid rgba(20,20,26,.08)">${items}</div>`;
}

/**
 * Emplacement du cachet, propre à chaque modèle.
 * - `beside` : ancré à la fin du contenu principal (espaceur du modèle), bas du
 *   cachet aligné sur le bas des totaux, dans le vide laissé à côté d'eux. Suit
 *   la longueur de la facture et ne sort jamais de la page.
 * - `below` : juste sous le contenu principal, pour les modèles dont les totaux
 *   occupent toute la largeur.
 * - `page` : position fixe sur la page (haut ou bas selon `fromBottom`), pour
 *   les modèles en colonnes étroites et les emplacements choisis à la main.
 */
type StampPlacement = {
  mode: 'beside' | 'below' | 'page';
  fromBottom?: boolean;
  side: 'left' | 'right';
  x: number;
  y: number;
  rotate: number;
};

const DEFAULT_STAMP: StampPlacement = { mode: 'beside', side: 'left', x: 56, y: 6, rotate: -8 };

const STAMP_PLACEMENTS: Record<string, Partial<StampPlacement>> = {
  '05': { mode: 'below', side: 'left', x: 40, y: 20 },
  '06': { mode: 'below', y: 22 },
  '09': { mode: 'below', y: 22 },
  '11': { mode: 'below', y: 22 },
  '13': { mode: 'below', y: 22 },
  '14': { mode: 'below', y: 22 },
  '15': { mode: 'page', side: 'left', x: 90, y: 420 },
  '16': { mode: 'below', y: 22 },
  '17': { mode: 'below', x: 44, y: 22 },
  '18': { mode: 'page', side: 'left', x: 90, y: 420 },
  '19': { mode: 'below', y: 22 },
  '20': { mode: 'below', y: 26 },
};

function stampPlacement(
  templateId: string,
  position: NonNullable<TemplateContext['paidStamp']>['position'],
): StampPlacement {
  const auto = { ...DEFAULT_STAMP, ...STAMP_PLACEMENTS[templateId] };

  switch (position) {
    case 'top':
      // Coin supérieur droit, sous le bandeau légal : là où l'on tamponne à la main.
      return { mode: 'page', side: 'right', x: 36, y: 34, rotate: -8 };
    case 'bottom':
      return { mode: 'page', fromBottom: true, side: 'right', x: 56, y: 130, rotate: -8 };
    default:
      return auto;
  }
}

/** Couleur du modèle si elle est franche, sinon vert encre. */
function templateStampColor(accent: string | null): string {
  const match = accent?.match(/^#([0-9a-f]{6})$/i);
  if (match) {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(match[1].slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b);
    const saturation = max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
    if (saturation > 0.3 && max > 0.25) {
      return accent as string;
    }
  }
  return STAMP_GREEN;
}

/** Cachet « Facture payée » au nom de l'entreprise émettrice. */
function paidStamp(context: TemplateContext, template: PdfTemplateDefinition): string {
  if (!context.paidStamp) {
    return '';
  }

  const { companyName, date, color, position } = context.paidStamp;
  const place = stampPlacement(template.id, position);
  const ink = color === 'auto' ? templateStampColor(template.accent) : STAMP_COLOR_VALUES[color];

  const vertical =
    place.mode === 'beside' || place.fromBottom ? `bottom:${u(place.y)}` : `top:${u(place.y)}`;
  const anchor =
    place.mode === 'page'
      ? '<div aria-hidden="true" style="position:absolute; inset:0; z-index:5; pointer-events:none">'
      : '<div aria-hidden="true" style="position:relative; height:0; z-index:5">';

  return `${anchor}<div style="position:absolute; ${vertical}; ${place.side}:${u(place.x)}; transform:rotate(${place.rotate}deg); min-width:${u(190)}; max-width:${u(260)}; padding:${u(9)} ${u(18)} ${u(8)}; border:${u(3.5)} double ${ink}; border-radius:${u(10)}; color:${ink}; background:transparent; text-align:center; opacity:.88; mix-blend-mode:multiply; font-family:'Plus Jakarta Sans', Arial, sans-serif">
    <div style="font-size:${u(18)}; font-weight:800; letter-spacing:.14em; line-height:1.1">FACTURE PAYÉE</div>
    ${
      companyName
        ? `<div style="margin-top:${u(5)}; padding-top:${u(5)}; border-top:1px solid ${ink}; font-size:${u(10)}; font-weight:700; letter-spacing:.06em; text-transform:uppercase; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${escapeHtml(
            companyName,
          )}</div>`
        : ''
    }
    ${date ? `<div style="margin-top:${u(2)}; font-size:${u(9)}; font-weight:600">le ${escapeHtml(date)}</div>` : ''}
  </div></div>`;
}

function insertAfter(html: string, pattern: RegExp, extra: string): string | null {
  const match = html.match(pattern);
  if (!match || match.index === undefined) return null;
  const at = match.index + match[0].length;
  return `${html.slice(0, at)}${extra}${html.slice(at)}`;
}

function insertBefore(html: string, pattern: RegExp, extra: string): string | null {
  const match = html.match(pattern);
  if (!match || match.index === undefined) return null;
  return `${html.slice(0, match.index)}${extra}${html.slice(match.index)}`;
}

/** Bandeau légal en tête de page, cachet à la fin du contenu principal. */
function withPageExtras(
  html: string,
  context: TemplateContext,
  template: PdfTemplateDefinition,
): string {
  let result = html;

  const strip = legalIdsStrip(context);
  if (strip) {
    result = insertAfter(result, /<div class="dc-page"[^>]*>/, strip) ?? `${strip}${result}`;
  }

  const stamp = paidStamp(context, template);
  if (stamp && context.paidStamp) {
    const onPage = stampPlacement(template.id, context.paidStamp.position).mode === 'page';
    result =
      (onPage ? null : insertBefore(result, /<div class="dc-spacer"/, stamp)) ??
      insertAfter(result, /<div class="dc-page"[^>]*>/, stamp) ??
      `${stamp}${result}`;
  }

  return result;
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
${withPageExtras(template.render(context), context, template)}
</body>
</html>`;
}

export { PAGE_HEIGHT, PAGE_WIDTH };
