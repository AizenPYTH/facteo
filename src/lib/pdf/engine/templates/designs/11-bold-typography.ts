import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import {
  FONTS,
  addressLines,
  escapeHtml,
  escapeMultiline,
  legalBlock,
  qrSlot,
  u,
} from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';

const INK = '#0D0D0D';
const MUTED = '#767676';

/** Colonne de totaux en texte courant : « libellé valeur » sur trois colonnes. */
function textColumn(rows: { label: string; value: string; strong?: boolean }[]): string {
  return `<div style="flex:1; min-width:0">${rows
    .map(
      (row) =>
        `${row.strong ? '<span style="color:' + INK + '; font-weight:700">' : ''}${escapeHtml(
          row.label,
        )} <span style="color:${INK}${row.strong ? '; font-weight:700' : ''}">${escapeHtml(
          row.value,
        )}</span>${row.strong ? '</span>' : ''}`,
    )
    .join('<br/>')}</div>`;
}

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;
  const vatRows = totals.rows.filter((row) => row.label.startsWith('TVA'));
  const baseRows = totals.rows.filter((row) => !row.label.startsWith('TVA'));

  return `<div class="dc-page" style="font-family:${FONTS.archivo}; color:${INK}; background:#fff; padding:${u(
    52,
  )} ${u(54)} ${u(42)}">
  <div style="display:flex; justify-content:space-between; gap:${u(24)}; font-size:${u(
    10.5,
  )}; line-height:1.7; color:${MUTED}">
    <div>
      <span style="color:${INK}; font-weight:600">${escapeHtml(issuer.name)}</span><br/>
      ${addressLines([
        issuer.addressLines.join(', '),
        [issuer.siret ? `SIRET ${issuer.siret}` : '', issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '']
          .filter(Boolean)
          .join(' · '),
      ])}
    </div>
    <div style="text-align:right">
      <span style="color:${INK}; font-weight:600">${escapeHtml(context.number)}</span><br/>
      ${addressLines([
        context.meta.map((entry) => `${entry.label} ${entry.value}`).join(' · '),
        context.payment.terms ?? '',
      ])}
    </div>
  </div>

  <div style="margin-top:${u(40)}">
    <div style="font-size:${u(11)}; letter-spacing:${u(
      2,
    )}; text-transform:uppercase; color:${MUTED}">${escapeHtml(labels.amountDue)}</div>
    <div style="font-size:${u(104)}; font-weight:800; letter-spacing:${u(
      -5,
    )}; line-height:.9; margin-top:${u(10)}">${escapeHtml(totals.amountDue)}</div>
    <div style="font-size:${u(15)}; font-weight:600; margin-top:${u(18)}">${escapeHtml(
      [client.name, client.contactName].filter(Boolean).join(' — '),
    )}<br/><span style="font-weight:400; font-size:${u(11)}; color:${MUTED}">${escapeHtml(
      [client.addressLines.join(', '), client.vatNumber ? `TVA ${client.vatNumber}` : '']
        .filter(Boolean)
        .join(' · '),
    )}</span></div>
  </div>

  <div style="margin-top:${u(44)}; border-top:${u(4)} solid ${INK}">
    ${context.lines
      .map(
        (line) => `<div style="display:flex; gap:${u(12)}; padding:${u(
          11,
        )} 0; border-bottom:1px solid #E2E2E2; font-size:${u(12)}; align-items:baseline">
          <div style="flex:1; min-width:0">
            <span style="font-weight:600">${escapeHtml(line.title)}</span>
            ${
              line.description
                ? `<span style="color:${MUTED}"> — ${escapeMultiline(line.description)}</span>`
                : ''
            }
          </div>
          <div style="width:${u(130)}; color:${MUTED}; flex-shrink:0">${escapeHtml(
            `${line.quantity} × ${line.unitPrice}`,
          )}</div>
          <div style="width:${u(44)}; color:${MUTED}; text-align:right; flex-shrink:0">${escapeHtml(
            line.vatRate,
          )}</div>
          <div style="width:${u(92)}; text-align:right; font-weight:700; flex-shrink:0">${escapeHtml(
            line.totalHt,
          )}</div>
        </div>`,
      )
      .join('')}
  </div>

  <div class="dc-keep" style="display:flex; gap:${u(26)}; margin-top:${u(22)}; font-size:${u(
    11,
  )}; line-height:1.9; color:${MUTED}">
    ${textColumn(baseRows)}
    ${textColumn(vatRows.length > 0 ? vatRows : [{ label: 'TVA', value: totals.totalVat }])}
    ${textColumn([
      { label: 'Total TTC', value: totals.totalTtc },
      ...(totals.deposit ? [{ label: 'Acompte', value: totals.deposit }] : []),
      { label: labels.amountDue, value: totals.amountDue, strong: true },
    ])}
  </div>

  <div class="dc-spacer"></div>

  <div class="dc-keep" style="display:flex; gap:${u(
    22,
  )}; align-items:flex-end; border-top:1px solid #E2E2E2; padding-top:${u(16)}">
    ${qrSlot(context.qrSvg, 60)}
    <div style="flex:1">
      ${legalBlock(
        [context.payment.summary ?? '', context.notes ?? '', ...context.legalMentions].filter(Boolean),
        { color: '#8C8C8C', lineHeight: 1.85 },
      )}
    </div>
  </div>
</div>`;
}

export const template11: PdfTemplateDefinition = {
  id: '11',
  name: 'Bold Typography',
  description: 'Le montant dû occupe le haut de page en 104 px. Tout le reste est réduit à l’essentiel.',
  accent: '#0D0D0D',
  paper: '#FFFFFF',
  render,
};
