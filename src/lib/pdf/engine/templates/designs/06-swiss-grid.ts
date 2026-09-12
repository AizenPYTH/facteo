import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import {
  FONTS,
  addressLines,
  escapeHtml,
  legalBlock,
  logoBanner,
  lineTable,
  qrSlot,
  u,
} from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';

const RED = '#D4261E';
const INK = '#111111';
const LABEL = '#9A9A9A';
const SOFT = '#8E8E8E';

function gridColumn(label: string, lines: string[], accent = false): string {
  return `<div style="flex:1; min-width:0">
    <div style="font-size:${u(9)}; letter-spacing:${u(
      1.6,
    )}; text-transform:uppercase; color:${accent ? RED : LABEL}">${escapeHtml(label)}</div>
    <div style="font-size:${u(11)}; line-height:1.65; margin-top:${u(6)}">${addressLines(lines)}</div>
  </div>`;
}

function summaryCell(label: string, value: string, accent = false): string {
  return `<div style="flex:1; min-width:0">
    <div style="font-size:${u(9)}; letter-spacing:${u(
      1.4,
    )}; text-transform:uppercase; color:${accent ? RED : LABEL}">${escapeHtml(label)}</div>
    <div style="font-size:${u(15)}; font-weight:${accent ? 800 : 600}; margin-top:${u(
      5,
    )}">${escapeHtml(value)}</div>
  </div>`;
}

/** « Facture / 142 » : le titre reprend la fin du numéro en très grand. */
function shortNumber(value: string): string {
  const tail = value.split(/[-/\s]/).pop();
  return tail && /\d/.test(tail) ? tail.replace(/^0+(?=\d)/, '') : value;
}

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;

  const summaryCells = [
    ...totals.rows.slice(0, 3).map((row) => summaryCell(row.label, row.value)),
    summaryCell('Total TTC', totals.totalTtc, true),
  ];

  return `<div class="dc-page" style="font-family:${FONTS.archivo}; color:${INK}; background:#fff; padding:${u(
    52,
  )} ${u(52)} ${u(40)}">
  ${logoBanner(context.logoUrl, { maxHeight: 36, marginBottom: 14 })}
  <div style="display:flex; gap:${u(20)}; border-top:${u(3)} solid ${INK}; padding-top:${u(14)}">
    ${gridColumn(labels.issuer, [
      issuer.name,
      ...issuer.addressLines,
      issuer.siret ? `SIRET ${issuer.siret}` : '',
    ])}
    ${gridColumn('Client', [
      client.name,
      client.contactName ?? '',
      ...client.addressLines,
      client.vatNumber ? `TVA ${client.vatNumber}` : '',
    ])}
    ${gridColumn('Document', [
      context.number,
      ...context.meta.map((entry) => `${entry.label} ${entry.value}`),
    ])}
    ${gridColumn(
      labels.amountDue,
      [
        totals.amountDue,
        context.payment.terms ?? '',
        ...context.payment.methods.slice(0, 1),
        issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '',
      ],
      true,
    )}
  </div>

  <div style="font-size:${u(80)}; font-weight:800; letter-spacing:${u(-4)}; line-height:.95; margin-top:${u(
    54,
  )}">${escapeHtml(labels.document)}<br/><span style="color:${RED}">${escapeHtml(
    shortNumber(context.number),
  )}</span></div>

  <div style="margin-top:${u(52)}">
    ${lineTable(context, {
      columns: ['index', 'vat'],
      headBorder: `1px solid ${INK}`,
      headColor: LABEL,
      headSize: 9,
      headTracking: 1.4,
      rowBorder: '1px solid #E6E6E6',
      valueColor: INK,
      descriptionColor: SOFT,
      rowPadding: 10,
    })}
  </div>

  <div class="dc-keep" style="display:flex; gap:${u(20)}; margin-top:${u(28)}">${summaryCells.join(
    '',
  )}</div>

  <div class="dc-keep" style="display:flex; justify-content:space-between; align-items:baseline; gap:${u(
    24,
  )}; border-top:${u(3)} solid ${INK}; margin-top:${u(18)}; padding-top:${u(14)}">
    <div style="font-size:${u(14)}; font-weight:600">${escapeHtml(
      [totals.deposit ? `Acompte versé ${totals.deposit}` : '', labels.amountDue]
        .filter(Boolean)
        .join(' · '),
    )}</div>
    <div style="font-size:${u(30)}; font-weight:800; letter-spacing:${u(-1.2)}">${escapeHtml(
      totals.amountDue,
    )}</div>
  </div>

  ${
    context.notes
      ? `<div style="margin-top:${u(16)}; font-size:${u(
          10.5,
        )}; line-height:1.7; color:${SOFT}">${escapeHtml(context.notes)}</div>`
      : ''
  }

  <div class="dc-spacer"></div>

  <div class="dc-keep" style="display:flex; gap:${u(24)}; align-items:flex-end">
    <div style="flex:1">
      ${legalBlock([context.payment.summary ?? '', ...context.legalMentions].filter(Boolean), {
        color: SOFT,
        size: 9,
      })}
    </div>
    ${qrSlot(context.qrSvg, 56)}
  </div>
</div>`;
}

export const template06: PdfTemplateDefinition = {
  id: '06',
  name: 'Swiss Grid',
  description: 'Grille stricte à 4 colonnes, filets épais, un seul accent rouge, titre en 80 px.',
  accent: RED,
  paper: '#FFFFFF',
  render,
};
