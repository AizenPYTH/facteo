import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const INK = '#1D3A8A';
const PRINT = '#4A4A4A';
const RULE = '#C9D6EE';
const MARGIN = '#E88A8A';

/** Carnet à souches : papier ligné, marge rouge, valeurs écrites à la main. */
function render(context: TemplateContext): string {
  const { issuer, client, labels } = context;
  const hand = (text: string, size = 17) =>
    `<span style="font-family:${FONTS.caveat}; color:${INK}; font-size:${u(size)}">${text}</span>`;
  const label = (text: string) =>
    `<span style="font-family:${FONTS.courier}; color:${PRINT}; font-size:${u(9.5)}; text-transform:uppercase; letter-spacing:${u(0.5)}">${escapeHtml(text)}</span>`;

  return `<div class="dc-page" style="font-family:${FONTS.courier}; color:${PRINT}; background:#FFFEF7 repeating-linear-gradient(180deg, transparent 0 ${u(27)}, ${RULE} ${u(27)} ${u(28)}); padding:${u(46)} ${u(48)} ${u(40)} ${u(92)}">
  <div style="position:absolute; top:0; bottom:0; left:${u(70)}; width:${u(1.5)}; background:${MARGIN}"></div>
  <div style="display:flex; justify-content:space-between; align-items:baseline">
    <div style="font-family:${FONTS.courier}; font-size:${u(22)}; font-weight:700; letter-spacing:${u(2)}; text-transform:uppercase">${escapeHtml(labels.document)}</div>
    <div>${label('N°')} ${hand(escapeHtml(context.number), 20)}</div>
  </div>
  <div style="margin-top:${u(6)}">${context.meta.map((entry) => `${label(entry.label)} ${hand(escapeHtml(entry.value), 16)}`).join(' &nbsp; ')}</div>

  <div style="display:flex; gap:${u(30)}; margin-top:${u(22)}">
    <div style="flex:1; line-height:${u(28)}">
      ${label(labels.issuer)}<br/>${hand(escapeHtml(issuer.name), 20)}<br/>
      ${issuer.addressLines.map((line) => hand(escapeHtml(line), 15)).join('<br/>')}
      ${context.issuerLegalIds.map((entry) => `<br/>${label(entry.label)} ${hand(escapeHtml(entry.value), 15)}`).join('')}
    </div>
    <div style="flex:1; line-height:${u(28)}">
      ${label(labels.billedTo)}<br/>${hand(escapeHtml(client.name), 20)}<br/>
      ${client.addressLines.map((line) => hand(escapeHtml(line), 15)).join('<br/>')}
    </div>
  </div>

  <div style="margin-top:${u(22)}">
    <div style="display:flex; border-bottom:${u(1.5)} solid ${PRINT}; padding-bottom:${u(3)}">
      <div style="flex:1">${label(labels.designation)}</div>
      <div style="width:${u(80)}; text-align:right">${label(labels.quantity)}</div>
      <div style="width:${u(100)}; text-align:right">${label(labels.unitPrice)}</div>
      <div style="width:${u(100)}; text-align:right">${label(labels.totalHt)}</div>
    </div>
    ${context.lines
      .map(
        (line) => `<div style="display:flex; align-items:baseline; min-height:${u(28)}; line-height:${u(28)}">
          <div style="flex:1">${hand(escapeHtml(line.title))}${line.description ? ` <span style="font-family:${FONTS.caveat}; color:${INK}; opacity:.75; font-size:${u(14)}">(${escapeHtml(line.description)})</span>` : ''}</div>
          <div style="width:${u(80)}; text-align:right">${hand(quantityText(line))}</div>
          <div style="width:${u(100)}; text-align:right">${hand(escapeHtml(line.unitPrice))}</div>
          <div style="width:${u(100)}; text-align:right">${hand(escapeHtml(line.totalHt))}</div>
        </div>`,
      )
      .join('')}
  </div>

  <div class="dc-keep" style="margin:${u(14)} 0 0 auto; width:${u(300)}; line-height:${u(28)}">
    ${totalsList(context)
      .map(
        (entry) =>
          `<div style="display:flex; justify-content:space-between; ${entry.kind === 'final' ? `border:${u(2)} solid ${INK}; border-radius:${u(14)}; padding:0 ${u(12)}; margin-top:${u(6)};` : ''}">${label(entry.label)}${hand(
            escapeHtml(entry.value),
            entry.kind === 'final' ? 22 : 17,
          )}</div>`,
      )
      .join('')}
  </div>

  <div style="margin-top:${u(18)}; line-height:${u(28)}">
    ${context.payment.terms ? `${label(labels.payment)} ${hand(escapeHtml(context.payment.terms), 15)}<br/>` : ''}
    ${paymentLines(context).map((line) => hand(escapeHtml(line), 15)).join('<br/>')}
    ${context.notes ? `<br/>${hand(escapeHtml(context.notes), 15)}` : ''}
  </div>

  <div class="dc-spacer"></div>
  <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:${u(20)}">
    <div style="font-size:${u(8.5)}; line-height:1.6">${joinLines(context.legalMentions)}</div>
    ${qrSlot(context.qrSvg, 64)}
  </div>
</div>`;
}

export const template24: PdfTemplateDefinition = {
  id: '24',
  name: 'Carnet',
  description: 'Carnet à souches : papier ligné, marge rouge, montants écrits à l’encre bleue.',
  accent: '#1D3A8A',
  paper: '#FFFEF7',
  render,
  vocabulary: 'craft',
  category: 'artisan',
  ownsLegalIds: true,
};
