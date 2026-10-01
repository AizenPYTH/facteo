import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, legalIdsText, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const CREAM = '#FBF1DE';
const ORANGE = '#E07A2E';
const MUSTARD = '#E8B23A';
const BROWN = '#6B3E26';
const INK = '#3A2417';
const SOFT = '#8A6A55';

/** Trois bandes arrondies empilées, décalées comme un sticker des années 70. */
function stripes(direction: 'down' | 'up'): string {
  const colors = direction === 'down' ? [ORANGE, MUSTARD, BROWN] : [BROWN, MUSTARD, ORANGE];

  return colors
    .map((color, index) => {
      const inset = direction === 'down' ? index * 36 : (2 - index) * 36;
      const radius = direction === 'down' ? `0 0 ${u(40)} ${u(40)}` : `${u(40)} ${u(40)} 0 0`;

      return `<div style="height:${u(14)}; margin:${index === 0 ? 0 : u(5)} ${u(inset)} 0; background:${color}; border-radius:${radius}"></div>`;
    })
    .join('');
}

/** Rétro 70 : bandes arrondies orange, moutarde et brun, titre Fraunces très gras, pastille de total. */
function render(context: TemplateContext): string {
  const { issuer, client, labels, totals } = context;
  const legal = legalIdsText(context);
  const payment = [context.payment.terms, ...paymentLines(context)];
  const hasPayment = payment.some(Boolean);

  const circle = (text: string, color: string) =>
    `<div style="width:${u(30)}; height:${u(30)}; flex-shrink:0; border-radius:50%; background:${color}; color:${CREAM}; display:flex; align-items:center; justify-content:center; font-family:${FONTS.fraunces}; font-weight:900; font-size:${u(13)}">${text}</div>`;

  const palette = [ORANGE, MUSTARD, BROWN];

  return `<div class="dc-page" style="font-family:${FONTS.workSans}; color:${INK}; background:${CREAM}">
  <div style="padding-top:0">${stripes('down')}</div>

  <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:${u(24)}; padding:${u(30)} ${u(52)} 0">
    <div style="min-width:0">
      ${context.logoUrl ? `<img src="${escapeHtml(context.logoUrl)}" alt="" style="display:block; max-height:${u(46)}; max-width:${u(190)}; margin-bottom:${u(10)}" />` : ''}
      <div style="font-family:${FONTS.fraunces}; font-weight:900; font-size:${u(62)}; line-height:0.92; letter-spacing:${u(-2)}; color:${BROWN}">${escapeHtml(labels.document)}<span style="color:${ORANGE}">.</span></div>
      <div style="display:inline-block; margin-top:${u(10)}; background:${MUSTARD}; color:${INK}; border-radius:${u(30)}; padding:${u(5)} ${u(16)}; font-family:${FONTS.fraunces}; font-weight:700; font-size:${u(14)}">${escapeHtml(labels.number)} ${escapeHtml(context.number)}</div>
    </div>
    <div style="text-align:right; font-size:${u(10.5)}; line-height:1.6; max-width:${u(270)}">
      <div style="font-family:${FONTS.fraunces}; font-weight:800; font-size:${u(17)}; color:${ORANGE}">${escapeHtml(issuer.name)}</div>
      <div>${joinLines([...issuer.addressLines, issuer.phone, issuer.email])}</div>
      ${legal ? `<div style="color:${SOFT}; font-size:${u(9.5)}; margin-top:${u(2)}">${escapeHtml(legal)}</div>` : ''}
    </div>
  </div>

  <div style="display:flex; gap:${u(18)}; padding:${u(26)} ${u(52)} 0">
    <div style="flex:1.3; border:${u(3)} solid ${BROWN}; border-radius:${u(26)}; padding:${u(14)} ${u(20)}; font-size:${u(11)}; line-height:1.6">
      <div style="font-family:${FONTS.fraunces}; font-weight:800; font-size:${u(13)}; color:${ORANGE}">${escapeHtml(labels.billedTo)}</div>
      <div style="font-weight:700; font-size:${u(14)}">${escapeHtml(client.name)}</div>
      ${client.contactName ? `<div>${escapeHtml(client.contactName)}</div>` : ''}
      <div>${joinLines(client.addressLines)}</div>
      ${client.vatNumber ? `<div style="color:${SOFT}; font-size:${u(9.5)}">TVA ${escapeHtml(client.vatNumber)}</div>` : ''}
    </div>
    <div style="flex:1; display:flex; flex-direction:column; gap:${u(8)}">
      ${context.meta
        .map(
          (entry, index) => `<div style="display:flex; justify-content:space-between; align-items:center; gap:${u(10)}; background:${palette[index % 3]}; color:${index % 3 === 1 ? INK : CREAM}; border-radius:${u(30)}; padding:${u(7)} ${u(16)}; font-size:${u(10.5)}">
          <span>${escapeHtml(entry.label)}</span><b style="font-family:${FONTS.fraunces}; font-size:${u(12.5)}">${escapeHtml(entry.value)}</b></div>`,
        )
        .join('')}
    </div>
  </div>

  <div style="padding:${u(26)} ${u(52)} 0">
    <div style="display:flex; gap:${u(12)}; padding:0 ${u(6)} ${u(8)}; border-bottom:${u(3)} solid ${BROWN}; font-family:${FONTS.fraunces}; font-weight:800; font-size:${u(11)}; color:${BROWN}">
      <span style="width:${u(30)}"></span>
      <span style="flex:1">${escapeHtml(labels.designation)}</span>
      <span style="width:${u(66)}; text-align:right">${escapeHtml(labels.quantity)}</span>
      <span style="width:${u(84)}; text-align:right">${escapeHtml(labels.unitPrice)}</span>
      <span style="width:${u(48)}; text-align:right">${escapeHtml(labels.vat)}</span>
      <span style="width:${u(92)}; text-align:right">${escapeHtml(labels.totalHt)}</span>
    </div>
    ${context.lines
      .map(
        (line) => `<div style="display:flex; gap:${u(12)}; align-items:flex-start; padding:${u(10)} ${u(6)}; border-bottom:${u(1.5)} dotted ${MUSTARD}; font-size:${u(11)}; page-break-inside:avoid">
        ${circle(String(line.index), palette[(line.index - 1) % 3])}
        <div style="flex:1; min-width:0; padding-top:${u(5)}">
          <div style="font-weight:700">${escapeHtml(line.title)}</div>
          ${line.description ? `<div style="font-size:${u(9.5)}; color:${SOFT}; margin-top:${u(2)}; line-height:1.45">${escapeHtml(line.description)}</div>` : ''}
        </div>
        <span style="width:${u(66)}; text-align:right; padding-top:${u(5)}">${quantityText(line)}</span>
        <span style="width:${u(84)}; text-align:right; padding-top:${u(5)}">${escapeHtml(line.unitPrice)}</span>
        <span style="width:${u(48)}; text-align:right; padding-top:${u(5)}; color:${SOFT}">${escapeHtml(line.vatRate)}</span>
        <span style="width:${u(92)}; text-align:right; padding-top:${u(5)}; font-weight:700">${escapeHtml(line.totalHt)}</span>
      </div>`,
      )
      .join('')}
  </div>

  <div class="dc-keep" style="display:flex; gap:${u(26)}; align-items:flex-start; padding:${u(24)} ${u(52)} 0">
    <div style="flex:1; font-size:${u(10.5)}; line-height:1.6">
      ${
        hasPayment
          ? `<div style="font-family:${FONTS.fraunces}; font-weight:800; font-size:${u(14)}; color:${ORANGE}">${escapeHtml(labels.payment)}</div>
      <div>${joinLines(payment)}</div>`
          : ''
      }
      ${context.notes ? `<div style="margin-top:${u(10)}; padding:${u(10)} ${u(14)}; background:#F4E2C2; border-radius:${u(16)}; font-style:italic">${escapeHtml(context.notes)}</div>` : ''}
      ${context.qrSvg ? `<div style="margin-top:${u(12)}; display:inline-block; padding:${u(6)}; background:#fff; border-radius:${u(12)}; border:${u(2)} solid ${MUSTARD}">${qrSlot(context.qrSvg, 62)}</div>` : ''}
    </div>
    <div style="width:${u(300)}">
      <div style="font-size:${u(10.5)}; padding:0 ${u(10)}">
        ${totalsList(context)
          .filter((entry) => entry.kind !== 'final')
          .map(
            (entry) => `<div style="display:flex; justify-content:space-between; padding:${u(4)} 0; ${entry.kind === 'ttc' ? `font-weight:700; border-top:${u(1.5)} solid ${BROWN}; margin-top:${u(4)}; padding-top:${u(7)};` : ''}"><span>${escapeHtml(entry.label)}</span><span>${escapeHtml(entry.value)}</span></div>`,
          )
          .join('')}
      </div>
      <div style="margin-top:${u(12)}; display:flex; justify-content:space-between; align-items:center; gap:${u(12)}; background:${ORANGE}; color:${CREAM}; border-radius:${u(60)}; padding:${u(12)} ${u(24)}; box-shadow:${u(5)} ${u(5)} 0 ${BROWN}">
        <span style="font-family:${FONTS.fraunces}; font-weight:800; font-size:${u(14)}">${escapeHtml(labels.amountDue)}</span>
        <span style="font-family:${FONTS.fraunces}; font-weight:900; font-size:${u(24)}; white-space:nowrap">${escapeHtml(totals.amountDue)}</span>
      </div>
    </div>
  </div>

  <div class="dc-spacer"></div>
  ${context.legalMentions.length > 0 ? `<div style="padding:0 ${u(52)} ${u(14)}; font-size:${u(8.5)}; line-height:1.6; color:${SOFT}; text-align:center">${joinLines(context.legalMentions)}</div>` : ''}
  <div>${stripes('up')}</div>
</div>`;
}

export const template38: PdfTemplateDefinition = {
  id: '38',
  name: 'Rétro 70',
  description: 'Esprit années 70 : bandes arrondies orange, moutarde et brun, titre Fraunces et pastille de total.',
  accent: ORANGE,
  paper: CREAM,
  render,
  vocabulary: 'friendly',
  category: 'creatif',
  ownsLegalIds: true,
};
