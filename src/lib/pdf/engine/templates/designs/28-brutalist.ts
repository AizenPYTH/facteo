import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, legalIdsText, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const INK = '#0A0A0A';
const POP = '#E6FF3D';
const BORDER = `${u(4)} solid ${INK}`;

/** Brutaliste : capitales condensées géantes, blocs noirs, bordures épaisses, jaune fluo. */
function render(context: TemplateContext): string {
  const { issuer, client, labels, totals } = context;
  const big = (text: string, size: number) =>
    `<div style="font-family:${FONTS.bebas}; font-size:${u(size)}; line-height:.88; letter-spacing:${u(1)}">${text}</div>`;

  return `<div class="dc-page" style="font-family:${FONTS.grotesk}; color:${INK}; background:#fff; padding:${u(34)}">
  <div style="border:${BORDER}">
    <div style="display:flex; border-bottom:${BORDER}">
      <div style="flex:1; padding:${u(14)}; background:${INK}; color:#fff">${big(escapeHtml(labels.documentUpper), 96)}</div>
      <div style="width:${u(250)}; padding:${u(14)}; background:${POP}">
        <div style="font-size:${u(10)}; font-weight:700">${escapeHtml(labels.number)}</div>
        ${big(escapeHtml(context.number), 34)}
        ${context.meta.map((entry) => `<div style="font-size:${u(10)}; margin-top:${u(6)}"><b>${escapeHtml(entry.label)}</b> ${escapeHtml(entry.value)}</div>`).join('')}
      </div>
    </div>
    <div style="display:flex; border-bottom:${BORDER}; font-size:${u(11)}; line-height:1.5">
      <div style="flex:1; padding:${u(14)}; border-right:${BORDER}">
        <div style="font-size:${u(9)}; font-weight:700; text-transform:uppercase">${escapeHtml(labels.issuer)}</div>
        <div style="font-size:${u(16)}; font-weight:700">${escapeHtml(issuer.name)}</div>
        ${joinLines([...issuer.addressLines, issuer.phone])}
        ${legalIdsText(context) ? `<div style="font-size:${u(9.5)}; margin-top:${u(4)}">${joinLines(context.issuerLegalIds.map((entry) => `${entry.label} ${entry.value}`))}</div>` : ''}
      </div>
      <div style="flex:1; padding:${u(14)}">
        <div style="font-size:${u(9)}; font-weight:700; text-transform:uppercase">${escapeHtml(labels.billedTo)}</div>
        <div style="font-size:${u(16)}; font-weight:700">${escapeHtml(client.name)}</div>
        ${joinLines([...client.addressLines, client.vatNumber ? `TVA ${client.vatNumber}` : ''])}
      </div>
    </div>
    ${context.lines
      .map(
        (line) => `<div style="display:flex; align-items:center; border-bottom:${u(2)} solid ${INK}; padding:${u(10)} ${u(14)}; gap:${u(14)}">
        ${big(String(line.index).padStart(2, '0'), 34)}
        <div style="flex:1; font-size:${u(12)}"><b>${escapeHtml(line.title).toUpperCase()}</b>${line.description ? `<div style="font-size:${u(10)}">${escapeHtml(line.description)}</div>` : ''}</div>
        <div style="font-size:${u(10.5)}; text-align:right">${quantityText(line)} × ${escapeHtml(line.unitPrice)}<br/>${escapeHtml(labels.vat)} ${escapeHtml(line.vatRate)}</div>
        <div style="width:${u(120)}; text-align:right; font-size:${u(15)}; font-weight:700">${escapeHtml(line.totalHt)}</div>
      </div>`,
      )
      .join('')}
    <div class="dc-keep" style="display:flex">
      <div style="flex:1; padding:${u(14)}; font-size:${u(10.5)}; line-height:1.55; border-right:${BORDER}">
        <div style="font-size:${u(9)}; font-weight:700; text-transform:uppercase">${escapeHtml(labels.payment)}</div>
        ${joinLines([context.payment.terms, ...paymentLines(context)])}
        ${context.notes ? `<div style="margin-top:${u(6)}">${escapeHtml(context.notes)}</div>` : ''}
      </div>
      <div style="width:${u(300)}">
        <div style="padding:${u(10)} ${u(14)}; font-size:${u(11)}">
          ${totalsList(context)
            .filter((entry) => entry.kind !== 'final')
            .map((entry) => `<div style="display:flex; justify-content:space-between; padding:${u(2)} 0"><span>${escapeHtml(entry.label)}</span><b>${escapeHtml(entry.value)}</b></div>`)
            .join('')}
        </div>
        <div style="background:${INK}; color:${POP}; padding:${u(12)} ${u(14)}">
          <div style="font-size:${u(9)}; font-weight:700; text-transform:uppercase">${escapeHtml(labels.amountDue)}</div>
          ${big(escapeHtml(totals.amountDue), 52)}
        </div>
      </div>
    </div>
  </div>

  <div class="dc-spacer"></div>
  <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:${u(20)}; font-size:${u(8.5)}; line-height:1.6">
    <div>${joinLines(context.legalMentions)}</div>
    ${qrSlot(context.qrSvg, 66)}
  </div>
</div>`;
}

export const template28: PdfTemplateDefinition = {
  id: '28',
  name: 'Brutal',
  description: 'Brutaliste : capitales condensées géantes, blocs noirs, bordures épaisses, jaune fluo.',
  accent: '#0A0A0A',
  paper: '#FFFFFF',
  render,
  vocabulary: 'minimal',
  category: 'creatif',
  ownsLegalIds: true,
};
