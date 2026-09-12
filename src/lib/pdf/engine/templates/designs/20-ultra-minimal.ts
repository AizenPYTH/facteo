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

const INK = '#202024';
const MUTED = '#8B8B95';
const SOFT = '#A6A6B0';

/** Le strict minimum légal, beaucoup de blanc, un seul filet, pas de tableau. */
function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;

  const summary = [
    ...totals.rows.map((row) => `${row.label} ${row.value}`),
    `TTC ${totals.totalTtc}`,
    totals.deposit ? `Acompte versé ${totals.deposit}` : '',
  ].filter(Boolean);

  return `<div class="dc-page" style="font-family:${FONTS.jakarta}; color:${INK}; background:#fff; padding:${u(
    86,
  )} ${u(78)} ${u(56)}">
  <div style="display:flex; justify-content:space-between; gap:${u(30)}; font-size:${u(
    11,
  )}; line-height:1.75">
    <div style="min-width:0">
      <span style="font-weight:700">${escapeHtml(issuer.name)}</span><br/>
      <span style="color:${MUTED}">${addressLines([
        issuer.addressLines.join(', '),
        [issuer.siret ? `SIRET ${issuer.siret}` : '', issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '']
          .filter(Boolean)
          .join(' · '),
      ])}</span>
    </div>
    <div style="text-align:right; min-width:0">
      <span style="font-weight:700">${escapeHtml(client.name)}</span><br/>
      <span style="color:${MUTED}">${addressLines([
        client.contactName ?? '',
        client.addressLines.join(', '),
        client.vatNumber ? `TVA ${client.vatNumber}` : '',
      ])}</span>
    </div>
  </div>

  <div style="margin-top:${u(76)}; font-size:${u(11)}; color:${MUTED}">${escapeHtml(
    [
      `${labels.document} ${context.number}`,
      ...context.meta.map((entry) => `${entry.label.toLowerCase()} ${entry.value}`),
    ].join(' · '),
  )}</div>

  <div style="margin-top:${u(34)}">
    ${context.lines
      .map(
        (line) => `<div style="display:flex; justify-content:space-between; gap:${u(
          20,
        )}; padding:${u(9)} 0; font-size:${u(12)}; font-variant-numeric:tabular-nums">
          <div style="color:#43434D; min-width:0">${escapeHtml(
            line.title,
          )} <span style="color:${SOFT}">· ${escapeHtml(
            `${line.quantity} × ${line.unitPrice} · TVA ${line.vatRate}`,
          )}</span>${
            line.description
              ? `<div style="color:${SOFT}; font-size:${u(10)}; margin-top:${u(
                  2,
                )}; line-height:1.5">${escapeMultiline(line.description)}</div>`
              : ''
          }</div>
          <div style="flex-shrink:0">${escapeHtml(line.totalHt)}</div>
        </div>`,
      )
      .join('')}
  </div>

  <div class="dc-keep" style="margin-top:${u(30)}; border-top:1px solid ${INK}; padding-top:${u(
    18,
  )}; font-size:${u(11)}; color:${MUTED}; line-height:1.9">${escapeHtml(summary.join(' · '))}</div>

  <div class="dc-keep" style="margin-top:${u(
    40,
  )}; display:flex; justify-content:space-between; align-items:baseline; gap:${u(20)}">
    <div style="font-size:${u(13)}; color:${MUTED}">${escapeHtml(labels.amountDue)}</div>
    <div style="font-size:${u(38)}; font-weight:700; letter-spacing:${u(-1.4)}">${escapeHtml(
      totals.amountDue,
    )}</div>
  </div>

  ${
    context.notes
      ? `<div style="margin-top:${u(24)}; font-size:${u(
          11,
        )}; line-height:1.7; color:${MUTED}">${escapeHtml(context.notes)}</div>`
      : ''
  }

  <div class="dc-spacer"></div>

  <div class="dc-keep" style="display:flex; gap:${u(22)}; align-items:flex-end">
    ${qrSlot(context.qrSvg, 50)}
    <div style="flex:1">
      ${legalBlock([context.payment.summary ?? '', ...context.legalMentions].filter(Boolean), {
        color: SOFT,
        size: 9,
        lineHeight: 1.9,
      })}
    </div>
  </div>
</div>`;
}

export const template20: PdfTemplateDefinition = {
  id: '20',
  name: 'Ultra Minimal',
  description: 'Le strict minimum légal, beaucoup de blanc, un seul filet, pas de tableau.',
  accent: null,
  paper: '#FFFFFF',
  render,
};
