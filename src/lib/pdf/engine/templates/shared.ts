/**
 * Briques communes aux 20 modèles.
 *
 * ## Unités
 *
 * Les maquettes sont dessinées en pixels CSS à 96 dpi (page A4 = 794 × 1123 px).
 * `expo-print` compose la page en points à 72 dpi (A4 = 595 × 842 pt). Les
 * valeurs du handoff sont donc reprises **telles quelles** dans le code —
 * lisibles et vérifiables face aux specs — et converties à l'écriture par
 * `u()` / `px()`. Un « 11.5 » dans un modèle correspond bien au 11,5 px de la
 * maquette, et mesure la même chose sur le papier.
 */

/** 96 dpi (maquette) → 72 dpi (page PDF). */
export const DESIGN_SCALE = 0.75;

/** Valeur de maquette → longueur CSS de la page PDF. */
export function u(designPx: number): string {
  return `${Number((designPx * DESIGN_SCALE).toFixed(3))}px`;
}

/** Idem, sans unité (pour composer des expressions CSS). */
export function px(designPx: number): number {
  return Number((designPx * DESIGN_SCALE).toFixed(3));
}

/** Page A4 en unités de sortie. */
export const PAGE_WIDTH = px(794);
export const PAGE_HEIGHT = px(1123);

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Texte saisi par l'utilisateur → HTML, sauts de ligne conservés. */
export function escapeMultiline(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br/>');
}

/**
 * Piles de polices.
 *
 * Les maquettes chargent 8 familles depuis Google Fonts. Un PDF doit se
 * composer sans réseau : la famille voulue est nommée en premier (utilisée si
 * l'appareil la possède), suivie d'une pile système de la même classe. Ce qui
 * distingue réellement les modèles — sans / serif / mono, graisses, tailles,
 * interlignes — est préservé.
 */
const SANS = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
const SERIF = `'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif`;
const MONO = `ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace`;

export const FONTS = {
  jakarta: `'Plus Jakarta Sans', ${SANS}`,
  archivo: `'Archivo', ${SANS}`,
  plexSans: `'IBM Plex Sans', ${SANS}`,
  plexMono: `'IBM Plex Mono', ${MONO}`,
  manrope: `'Manrope', ${SANS}`,
  grotesk: `'Space Grotesk', ${SANS}`,
  sourceSerif: `'Source Serif 4', ${SERIF}`,
  baskerville: `'Libre Baskerville', ${SERIF}`,
} as const;

export type FontStack = (typeof FONTS)[keyof typeof FONTS];

/* -------------------------------------------------------------------------- */
/* Blocs réutilisables                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Bloc identité de l'émetteur.
 *
 * Trois cas prévus par le handoff : logo horizontal, pastille carrée,
 * ou aucun logo — le nom devient alors l'identité. Jamais d'image cassée :
 * `logoUrl` n'arrive ici qu'une fois l'image embarquée en data-URI.
 */
export function logoMark(
  logoUrl: string | null,
  initials: string,
  options: {
    size?: number;
    radius?: number;
    border?: string;
    background?: string;
    color?: string;
    fontSize?: number;
    fontWeight?: number;
    maxWidth?: number;
  } = {},
): string {
  const {
    size = 30,
    radius = 0,
    border,
    background = 'transparent',
    color = 'inherit',
    fontSize = 12,
    fontWeight = 700,
    maxWidth = 240,
  } = options;

  if (logoUrl) {
    return `<img src="${escapeHtml(logoUrl)}" alt="" style="display:block; height:auto; width:auto; max-height:${u(
      size + 10,
    )}; max-width:${u(maxWidth)}; object-fit:contain" />`;
  }

  if (!initials) {
    return '';
  }

  return `<div style="width:${u(size)}; height:${u(size)}; flex-shrink:0; border-radius:${u(
    radius,
  )}; ${border ? `border:${border};` : ''} background:${background}; color:${color}; display:flex; align-items:center; justify-content:center; font-size:${u(
    fontSize,
  )}; font-weight:${fontWeight}; letter-spacing:${u(0.5)}">${escapeHtml(initials)}</div>`;
}

/**
 * Logo horizontal placé au-dessus du nom de l'entreprise.
 *
 * Les maquettes sans pastille utilisent le nom comme identité (handoff § 3) ;
 * quand l'entreprise a réellement un logo, il vient s'y ajouter au format
 * horizontal (40 × 240 px max) plutôt que d'être ignoré. Rien n'est rendu si
 * aucun logo exploitable n'est disponible.
 */
export function logoBanner(
  logoUrl: string | null,
  options: { maxHeight?: number; maxWidth?: number; marginBottom?: number; align?: string } = {},
): string {
  if (!logoUrl) {
    return '';
  }

  const { maxHeight = 40, maxWidth = 240, marginBottom = 10, align } = options;

  return `<img src="${escapeHtml(logoUrl)}" alt="" style="display:block; height:auto; width:auto; max-height:${u(
    maxHeight,
  )}; max-width:${u(maxWidth)}; object-fit:contain; margin-bottom:${u(marginBottom)}; ${
    align === 'right' ? 'margin-left:auto;' : align === 'center' ? 'margin-left:auto; margin-right:auto;' : ''
  }" />`;
}

/** Libellé de section : capitales espacées. */
export function sectionLabel(
  text: string,
  options: { color?: string; size?: number; tracking?: number; marginTop?: number } = {},
): string {
  const { color = '#9A9AA6', size = 9.5, tracking = 1.4, marginTop = 0 } = options;

  return `<div style="font-size:${u(size)}; letter-spacing:${u(
    tracking,
  )}; color:${color}; text-transform:uppercase; ${marginTop ? `margin-top:${u(marginTop)};` : ''}">${escapeHtml(
    text,
  )}</div>`;
}

/** Lignes d'adresse déjà filtrées : aucune ligne vide, jamais de « — ». */
export function addressLines(lines: string[]): string {
  return lines.filter(Boolean).map(escapeHtml).join('<br/>');
}

/**
 * Emplacement du QR de paiement.
 * Renvoie une chaîne vide si le document n'a pas de QR exploitable — le bloc
 * disparaît entièrement plutôt que de laisser un carré vide.
 */
export function qrSlot(qrSvg: string | null, size: number): string {
  if (!qrSvg) {
    return '';
  }

  return `<div style="width:${u(size)}; height:${u(size)}; flex-shrink:0">${qrSvg}</div>`;
}

/** Mentions légales : rien à afficher si l'utilisateur n'en a configuré aucune. */
export function legalBlock(
  mentions: string[],
  options: { color?: string; size?: number; lineHeight?: number } = {},
): string {
  if (mentions.length === 0) {
    return '';
  }

  const { color = '#8A8A99', size = 9.5, lineHeight = 1.8 } = options;

  return `<div style="font-size:${u(size)}; line-height:${lineHeight}; color:${color}">${mentions
    .map(escapeMultiline)
    .join('<br/>')}</div>`;
}

/* -------------------------------------------------------------------------- */
/* Tableau de lignes                                                           */
/* -------------------------------------------------------------------------- */

export type LineTableColumn = 'index' | 'unit' | 'vat';

export type LineTableOptions = {
  /** Colonnes optionnelles à afficher en plus de désignation / qté / P.U. / total. */
  columns?: LineTableColumn[];
  headBackground?: string;
  headColor?: string;
  headBorder?: string;
  rowBorder?: string;
  /** Lignes zébrées (modèle 17). */
  stripe?: string;
  labelColor?: string;
  descriptionColor?: string;
  valueColor?: string;
  fontSize?: number;
  descriptionSize?: number;
  headSize?: number;
  headTracking?: number;
  rowPadding?: number;
  bordered?: string;
  radius?: number;
  uppercase?: boolean;
};

type LineTableContext = {
  lines: {
    index: number;
    title: string;
    description: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    vatRate: string;
    totalHt: string;
  }[];
  labels: { designation: string; quantity: string; unitPrice: string; vat: string; totalHt: string };
};

/**
 * Tableau HTML réel (et non une grille CSS comme dans la maquette) :
 * `<thead>` se répète automatiquement en haut de chaque page et les lignes ne
 * sont jamais coupées en deux. C'est la seule structure qui tient la promesse
 * de pagination du handoff dans un moteur d'impression.
 */
export function lineTable(context: LineTableContext, options: LineTableOptions = {}): string {
  const {
    columns = ['vat'],
    headBackground = 'transparent',
    headColor = '#9A9AA6',
    headBorder = '1px solid #1A1A22',
    rowBorder = '1px solid #EFEFF3',
    stripe,
    labelColor = 'inherit',
    descriptionColor = '#8A8A99',
    valueColor = '#4A4A58',
    fontSize = 11.5,
    descriptionSize = 10,
    headSize = 9.5,
    headTracking = 1.2,
    rowPadding = 8,
    bordered,
    radius = 0,
    uppercase = true,
  } = options;

  const showIndex = columns.includes('index');
  const showUnit = columns.includes('unit');
  const showVat = columns.includes('vat');

  const headCell = (text: string, align: 'left' | 'right', width?: number) =>
    `<th style="${width ? `width:${u(width)};` : ''} text-align:${align}; padding:0 0 ${u(9)}; border-bottom:${headBorder}; font-size:${u(
      headSize,
    )}; font-weight:600; letter-spacing:${u(headTracking)}; color:${headColor}; ${
      uppercase ? 'text-transform:uppercase;' : ''
    } background:${headBackground}">${escapeHtml(text)}</th>`;

  const head = [
    showIndex ? headCell('N°', 'left', 26) : '',
    headCell(context.labels.designation, 'left'),
    headCell(context.labels.quantity, 'right', showUnit ? 46 : 58),
    showUnit ? headCell('Unité', 'left', 52) : '',
    headCell(context.labels.unitPrice, 'right', 78),
    showVat ? headCell(context.labels.vat, 'right', 44) : '',
    headCell(context.labels.totalHt, 'right', 90),
  ].join('');

  const body = context.lines
    .map((line, position) => {
      const background = stripe && position % 2 === 1 ? `background:${stripe};` : '';
      const cell = (content: string, align: 'left' | 'right', color = valueColor) =>
        `<td style="padding:${u(rowPadding)} 0; border-bottom:${rowBorder}; text-align:${align}; color:${color}; vertical-align:top; ${background}">${content}</td>`;

      const designation = [
        `<div style="font-weight:600; color:${labelColor}">${escapeHtml(line.title)}</div>`,
        line.description
          ? `<div style="font-size:${u(descriptionSize)}; color:${descriptionColor}; margin-top:${u(
              2,
            )}; line-height:1.45">${escapeMultiline(line.description)}</div>`
          : '',
      ].join('');

      return `<tr>${[
        showIndex ? cell(`<span style="color:${descriptionColor}">${line.index}</span>`, 'left') : '',
        cell(designation, 'left', labelColor),
        cell(escapeHtml(line.quantity), 'right'),
        showUnit ? cell(escapeHtml(line.unit), 'left', descriptionColor) : '',
        cell(escapeHtml(line.unitPrice), 'right'),
        showVat ? cell(escapeHtml(line.vatRate), 'right', descriptionColor) : '',
        cell(`<span style="font-weight:600; color:${labelColor}">${escapeHtml(line.totalHt)}</span>`, 'right'),
      ].join('')}</tr>`;
    })
    .join('');

  return `<table style="width:100%; border-collapse:collapse; table-layout:fixed; font-size:${u(
    fontSize,
  )}; font-variant-numeric:tabular-nums; ${bordered ? `border:${bordered};` : ''} ${
    radius ? `border-radius:${u(radius)}; overflow:hidden;` : ''
  }"><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

/* -------------------------------------------------------------------------- */
/* Totaux                                                                      */
/* -------------------------------------------------------------------------- */

export type TotalsRow = {
  label: string;
  value: string;
  /** Ligne mise en avant (Total TTC). */
  strong?: boolean;
  /** Ligne finale (Net à payer). */
  final?: boolean;
  borderBottom?: string;
};

export type TotalsContext = {
  rows: TotalsRow[];
  finalLabel: string;
  finalValue: string;
};

export type TotalsOptions = {
  labelColor?: string;
  valueColor?: string;
  finalColor?: string;
  fontSize?: number;
  strongSize?: number;
  finalSize?: number;
  finalBorderTop?: string;
  width?: number;
};

export function totalsRows(context: TotalsContext, options: TotalsOptions = {}): string {
  const {
    labelColor = '#6C6C78',
    valueColor = 'inherit',
    finalColor = 'inherit',
    fontSize = 11.5,
    strongSize = 13,
    finalSize = 17,
    finalBorderTop = '1px solid #1A1A22',
  } = options;

  const rows = context.rows
    .map(
      (row) =>
        `<div style="display:flex; justify-content:space-between; gap:${u(16)}; padding:${u(
          row.strong ? 10 : 6,
        )} 0; ${row.borderBottom ? `border-bottom:${row.borderBottom};` : ''} ${
          row.strong ? `font-weight:700; font-size:${u(strongSize)};` : ''
        }"><span style="color:${row.strong ? valueColor : labelColor}">${escapeHtml(
          row.label,
        )}</span><span style="color:${valueColor}">${escapeHtml(row.value)}</span></div>`,
    )
    .join('');

  const final = `<div style="display:flex; justify-content:space-between; gap:${u(16)}; padding:${u(
    12,
  )} 0 0; border-top:${finalBorderTop}; font-weight:800; font-size:${u(
    finalSize,
  )}; color:${finalColor}"><span>${escapeHtml(context.finalLabel)}</span><span>${escapeHtml(
    context.finalValue,
  )}</span></div>`;

  return `<div style="font-size:${u(fontSize)}; font-variant-numeric:tabular-nums">${rows}${final}</div>`;
}

/** Récapitulatif de TVA par taux (modèles 13 et 16). */
export function vatRecapTable(
  rows: { rate: string; base: string; amount: string }[],
  options: { border?: string; headBackground?: string; color?: string; muted?: string } = {},
): string {
  if (rows.length === 0) {
    return '';
  }

  const {
    border = '1px solid #E4E4EA',
    headBackground = '#F3F5F8',
    color = 'inherit',
    muted = '#8A8A99',
  } = options;

  const head = ['Taux', 'Base HT', 'Montant TVA']
    .map(
      (label, index) =>
        `<th style="text-align:${index === 0 ? 'left' : 'right'}; padding:${u(6)} ${u(
          8,
        )}; border:${border}; background:${headBackground}; font-size:${u(
          9,
        )}; font-weight:600; letter-spacing:${u(1)}; text-transform:uppercase; color:${muted}">${label}</th>`,
    )
    .join('');

  const body = rows
    .map(
      (row) =>
        `<tr>${[row.rate, row.base, row.amount]
          .map(
            (value, index) =>
              `<td style="text-align:${index === 0 ? 'left' : 'right'}; padding:${u(6)} ${u(
                8,
              )}; border:${border}; color:${color}">${escapeHtml(value)}</td>`,
          )
          .join('')}</tr>`,
    )
    .join('');

  return `<table style="width:100%; border-collapse:collapse; font-size:${u(
    10,
  )}; font-variant-numeric:tabular-nums"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}
