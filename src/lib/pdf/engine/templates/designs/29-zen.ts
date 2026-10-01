import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, legalIdsText, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const INK = '#2E2A26';
const SOFT = '#9A928A';
const SEAL = '#B23A2E';

/** Zen : beaucoup de vide, titre vertical, sceau rouge, Cormorant très fin. */
function render(context: TemplateContext): string {
  const { issuer, client, labels, totals } = context;

  return `<div class="dc-page" style="font-family:${FONTS.cormorant}; color:${INK}; background:#FBF9F4; padding:${u(64)} ${u(70)} ${u(52)} ${u(110)}">
  <div style="position:absolute; top:${u(64)}; left:${u(44)}; writing-mode:vertical-rl; font-size:${u(30)}; letter-spacing:${u(10)}; color:${INK}">${escapeHtml(labels.document)}</div>
  <div style="position:absolute; top:${u(64)}; right:${u(70)}; width:${u(58)}; height:${u(58)}; border:${u(2)} solid ${SEAL}; color:${SEAL}; display:flex; align-items:center; justify-content:center; font-size:${u(20)}; font-weight:700">${escapeHtml(issuer.initials)}</div>

  <div style="font-size:${u(13)}; color:${SOFT}">${escapeHtml(labels.number)} ${escapeHtml(context.number)}</div>
  <div style="font-size:${u(26)}; margin-top:${u(4)}">${escapeHtml(issuer.name)}</div>
  <div style="font-size:${u(12)}; color:${SOFT}; line-height:1.6">${joinLines(issuer.addressLines, ' · ')}</div>
  ${legalIdsText(context) ? `<div style="font-size:${u(11)}; color:${SOFT}">${escapeHtml(legalIdsText(context))}</div>` : ''}

  <div style="display:flex; gap:${u(60)}; margin-top:${u(56)}; font-size:${u(13)}; line-height:1.6">
    <div style="flex:1">
      <div style="font-size:${u(11)}; color:${SOFT}">${escapeHtml(labels.billedTo)}</div>
      <div style="font-size:${u(18)}">${escapeHtml(client.name)}</div>
      ${joinLines(client.addressLines)}
    </div>
    <div>
      ${context.meta.map((entry) => `<div style="font-size:${u(11)}; color:${SOFT}">${escapeHtml(entry.label)}</div><div style="margin-bottom:${u(6)}">${escapeHtml(entry.value)}</div>`).join('')}
    </div>
  </div>

  <div style="margin-top:${u(54)}">
    ${context.lines
      .map(
        (line) => `<div style="display:flex; align-items:baseline; gap:${u(14)}; padding:${u(12)} 0; border-bottom:${u(0.5)} solid #DDD6CC; font-size:${u(14)}">
        <div style="flex:1">${escapeHtml(line.title)}${line.description ? `<div style="font-size:${u(11.5)}; color:${SOFT}">${escapeHtml(line.description)}</div>` : ''}</div>
        <div style="color:${SOFT}; font-size:${u(12)}">${quantityText(line)} · ${escapeHtml(line.unitPrice)}</div>
        <div style="width:${u(110)}; text-align:right">${escapeHtml(line.totalHt)}</div>
      </div>`,
      )
      .join('')}
  </div>

  <div class="dc-keep" style="margin:${u(30)} 0 0 auto; width:${u(280)}; font-size:${u(13)}">
    ${totalsList(context)
      .filter((entry) => entry.kind !== 'final')
      .map((entry) => `<div style="display:flex; justify-content:space-between; color:${SOFT}"><span>${escapeHtml(entry.label)}</span><span>${escapeHtml(entry.value)}</span></div>`)
      .join('')}
    <div style="margin-top:${u(18)}; font-size:${u(11)}; color:${SOFT}; text-align:right">${escapeHtml(labels.amountDue)}</div>
    <div style="font-size:${u(40)}; font-weight:300; text-align:right; line-height:1.1">${escapeHtml(totals.amountDue)}</div>
  </div>

  ${context.notes ? `<div style="margin-top:${u(30)}; font-size:${u(13)}; font-style:italic; color:${SOFT}">${escapeHtml(context.notes)}</div>` : ''}

  <div class="dc-spacer"></div>
  <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:${u(24)}; font-size:${u(11)}; color:${SOFT}; line-height:1.6">
    <div>${joinLines([context.payment.terms, ...paymentLines(context), ...context.legalMentions])}</div>
    ${qrSlot(context.qrSvg, 60)}
  </div>
</div>`;
}

export const template29: PdfTemplateDefinition = {
  id: '29',
  name: 'Zen',
  description: 'Beaucoup de vide, titre vertical, sceau rouge aux initiales, écriture très fine.',
  accent: '#B23A2E',
  paper: '#FBF9F4',
  render,
  vocabulary: 'minimal',
  category: 'minimal',
  ownsLegalIds: true,
};
