import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, legalIdsText, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const INK = '#141414';
const RED = '#C8102E';
const GREY = '#6E6E6E';

/** Une de magazine : grand titre italique, colonnes, lettrine, filets épais. */
function render(context: TemplateContext): string {
  const { issuer, client, labels, totals } = context;
  const legal = legalIdsText(context, ' — ');

  return `<div class="dc-page" style="font-family:${FONTS.sourceSerif}; color:${INK}; background:#fff; padding:${u(40)} ${u(48)}">
  <div style="display:flex; justify-content:space-between; font-family:${FONTS.workSans}; font-size:${u(9.5)}; letter-spacing:${u(2)}; text-transform:uppercase; border-bottom:${u(1)} solid ${INK}; padding-bottom:${u(6)}">
    <span>${escapeHtml(issuer.name)}</span><span>${escapeHtml(context.issuedAt ?? '')}</span><span>${escapeHtml(labels.number)} ${escapeHtml(context.number)}</span>
  </div>

  <div style="font-family:${FONTS.playfair}; font-style:italic; font-size:${u(78)}; line-height:.95; letter-spacing:${u(-2)}; margin-top:${u(18)}">${escapeHtml(labels.document)}<span style="color:${RED}">.</span></div>
  <div style="border-top:${u(5)} solid ${INK}; border-bottom:${u(1)} solid ${INK}; height:${u(4)}; margin-top:${u(12)}"></div>

  <div style="display:flex; gap:${u(30)}; margin-top:${u(20)}; font-size:${u(11)}; line-height:1.6">
    <div style="flex:1.3">
      <p style="margin:0"><span style="float:left; font-family:${FONTS.playfair}; font-size:${u(54)}; line-height:.8; margin:${u(4)} ${u(8)} 0 0; color:${RED}">${escapeHtml(
        client.name.charAt(0),
      )}</span><b>${escapeHtml(client.name)}</b>${client.addressLines.length ? `, ${joinLines(client.addressLines, ', ')}` : ''}. ${escapeHtml(labels.billedTo)} ce document, émis par <b>${escapeHtml(
        issuer.name,
      )}</b>${issuer.addressLines.length ? ` (${joinLines(issuer.addressLines, ', ')})` : ''}.</p>
      ${legal ? `<p style="margin:${u(8)} 0 0; color:${GREY}; font-size:${u(10)}">${escapeHtml(legal)}</p>` : ''}
    </div>
    <div style="flex:1; border-left:${u(1)} solid ${INK}; padding-left:${u(18)}">
      ${context.meta
        .map(
          (entry) => `<div style="font-family:${FONTS.workSans}; font-size:${u(8.5)}; letter-spacing:${u(1.5)}; text-transform:uppercase; color:${GREY}; margin-top:${u(6)}">${escapeHtml(entry.label)}</div>
          <div style="font-size:${u(14)}; font-weight:700">${escapeHtml(entry.value)}</div>`,
        )
        .join('')}
    </div>
  </div>

  <div style="margin-top:${u(26)}">
    ${context.lines
      .map(
        (line, index) => `<div style="display:flex; gap:${u(18)}; padding:${u(12)} 0; border-top:${u(index === 0 ? 2 : 0.5)} solid ${INK}">
        <div style="font-family:${FONTS.playfair}; font-size:${u(26)}; color:${RED}; width:${u(40)}">${String(line.index).padStart(2, '0')}</div>
        <div style="flex:1">
          <div style="font-family:${FONTS.playfair}; font-size:${u(16)}; font-weight:700">${escapeHtml(line.title)}</div>
          ${line.description ? `<div style="font-size:${u(10.5)}; color:${GREY}; font-style:italic; margin-top:${u(2)}">${escapeHtml(line.description)}</div>` : ''}
          <div style="font-family:${FONTS.workSans}; font-size:${u(9.5)}; color:${GREY}; margin-top:${u(4)}">${quantityText(line)} · ${escapeHtml(line.unitPrice)} · ${escapeHtml(labels.vat)} ${escapeHtml(line.vatRate)}</div>
        </div>
        <div style="font-size:${u(15)}; font-weight:700; align-self:center">${escapeHtml(line.totalHt)}</div>
      </div>`,
      )
      .join('')}
  </div>

  <div class="dc-keep" style="display:flex; gap:${u(30)}; border-top:${u(2)} solid ${INK}; padding-top:${u(14)}; margin-top:${u(4)}">
    <div style="flex:1; font-size:${u(10.5)}; line-height:1.6; color:${GREY}">
      ${joinLines([context.payment.terms, ...paymentLines(context)])}
      ${context.notes ? `<p style="font-style:italic; color:${INK}">« ${escapeHtml(context.notes)} »</p>` : ''}
    </div>
    <div style="width:${u(300)}; font-size:${u(11.5)}">
      ${totalsList(context)
        .filter((entry) => entry.kind !== 'final')
        .map((entry) => `<div style="display:flex; justify-content:space-between; padding:${u(3)} 0"><span>${escapeHtml(entry.label)}</span><span>${escapeHtml(entry.value)}</span></div>`)
        .join('')}
      <div style="font-family:${FONTS.workSans}; font-size:${u(9)}; letter-spacing:${u(2)}; text-transform:uppercase; color:${RED}; margin-top:${u(10)}">${escapeHtml(labels.amountDue)}</div>
      <div style="font-family:${FONTS.playfair}; font-size:${u(40)}; font-weight:700; line-height:1">${escapeHtml(totals.amountDue)}</div>
    </div>
  </div>

  <div class="dc-spacer"></div>
  <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:${u(20)}; font-family:${FONTS.workSans}; font-size:${u(8.5)}; color:${GREY}; border-top:${u(1)} solid ${INK}; padding-top:${u(8)}">
    <div style="line-height:1.6">${joinLines(context.legalMentions)}</div>
    ${qrSlot(context.qrSvg, 60)}
  </div>
</div>`;
}

export const template26: PdfTemplateDefinition = {
  id: '26',
  name: 'Magazine',
  description: 'Une de magazine : titre italique géant, lettrine, numéros de rubrique, filets épais.',
  accent: '#C8102E',
  paper: '#FFFFFF',
  render,
  vocabulary: 'friendly',
  category: 'creatif',
  ownsLegalIds: true,
};
