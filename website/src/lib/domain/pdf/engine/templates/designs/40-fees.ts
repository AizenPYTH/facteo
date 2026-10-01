import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, legalIdsText, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const INK = '#22201C';
const MUTED = '#77716A';
const RULE = '#8C2F2F';
const PAPER = '#FFFFFF';
/** Abscisse du filet vertical, marge gauche du texte. */
const RULE_X = 92;
const TEXT_X = 118;

/**
 * Honoraires : note d'honoraires de profession libérale. Filet vertical bordeaux
 * sur toute la hauteur, en-tête de papier à lettres, prestations rédigées en
 * paragraphes numérotés, totaux en courte déclaration alignée à droite.
 */
function render(context: TemplateContext): string {
  const { issuer, client, labels, totals } = context;
  const legal = legalIdsText(context, ' — ');
  const payment = [context.payment.terms, ...paymentLines(context)];
  const hasPayment = payment.some(Boolean);
  const small = (text: string) =>
    `<span style="font-size:${u(9)}; letter-spacing:${u(1.6)}; text-transform:uppercase; color:${MUTED}">${text}</span>`;

  return `<div class="dc-page" style="font-family:${FONTS.baskerville}; color:${INK}; background:linear-gradient(90deg, ${PAPER} 0 ${u(RULE_X)}, ${RULE} ${u(RULE_X)} ${u(RULE_X + 1)}, ${PAPER} ${u(RULE_X + 1)} 100%); padding:${u(56)} ${u(64)} ${u(36)} ${u(TEXT_X)}">
  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:${u(24)}">
    <div style="min-width:0">
      <div style="font-size:${u(21)}; letter-spacing:${u(3)}; text-transform:uppercase">${escapeHtml(issuer.name)}</div>
      <div style="font-size:${u(9.5)}; font-style:italic; color:${MUTED}; line-height:1.7; margin-top:${u(6)}">${joinLines([...issuer.addressLines, issuer.phone, issuer.email], ' · ')}</div>
      ${legal ? `<div style="font-size:${u(8.5)}; color:${MUTED}; margin-top:${u(2)}">${escapeHtml(legal)}</div>` : ''}
    </div>
    ${context.logoUrl ? `<img src="${escapeHtml(context.logoUrl)}" alt="" style="display:block; max-height:${u(54)}; max-width:${u(150)}; flex-shrink:0" />` : ''}
  </div>
  <div style="border-top:${u(0.75)} solid ${INK}; margin-top:${u(18)}"></div>

  <div style="display:flex; justify-content:space-between; gap:${u(30)}; margin-top:${u(40)}">
    <div style="font-size:${u(10.5)}; line-height:1.7">
      ${context.meta.map((entry) => `<div>${small(escapeHtml(entry.label))}&nbsp;&nbsp;${escapeHtml(entry.value)}</div>`).join('')}
    </div>
    <div style="width:${u(250)}; font-size:${u(11)}; line-height:1.7">
      ${small(escapeHtml(labels.billedTo))}
      <div style="margin-top:${u(4)}">${escapeHtml(client.name)}</div>
      ${client.contactName ? `<div>${escapeHtml(client.contactName)}</div>` : ''}
      <div>${joinLines(client.addressLines)}</div>
      ${client.vatNumber ? `<div style="font-size:${u(9.5)}; color:${MUTED}">TVA ${escapeHtml(client.vatNumber)}</div>` : ''}
    </div>
  </div>

  <div style="margin-top:${u(46)}; text-align:center">
    <div style="font-size:${u(17)}; letter-spacing:${u(5)}; text-transform:uppercase">${escapeHtml(labels.document)}</div>
    <div style="font-size:${u(11)}; font-style:italic; color:${MUTED}; margin-top:${u(4)}">${escapeHtml(labels.number)} ${escapeHtml(context.number)}</div>
  </div>

  <div style="margin-top:${u(30)}">
    ${small(escapeHtml(labels.designation))}
    ${context.lines
      .map(
        (line) => `<div style="display:flex; gap:${u(14)}; margin-top:${u(14)}; font-size:${u(11.5)}; line-height:1.75; page-break-inside:avoid">
        <div style="width:${u(22)}; flex-shrink:0; text-align:right">${line.index}.</div>
        <div style="flex:1; min-width:0; text-align:justify">
          <span style="font-weight:700">${escapeHtml(line.title)}</span>${line.description ? ` — <span style="font-style:italic">${escapeHtml(line.description)}</span>` : ''}
          <div style="font-size:${u(9.5)}; color:${MUTED}; margin-top:${u(1)}">${escapeHtml(labels.quantity)} ${quantityText(line)} · ${escapeHtml(labels.unitPrice)} ${escapeHtml(line.unitPrice)} · ${escapeHtml(labels.vat)} ${escapeHtml(line.vatRate)}</div>
        </div>
        <div style="width:${u(110)}; flex-shrink:0; text-align:right; white-space:nowrap">${escapeHtml(line.totalHt)}</div>
      </div>`,
      )
      .join('')}
  </div>

  <div class="dc-keep" style="margin-top:${u(34)}">
    <div style="margin-left:auto; width:${u(320)}; font-size:${u(11)}; line-height:1.9">
      ${totalsList(context)
        .filter((entry) => entry.kind !== 'final')
        .map(
          (entry) => `<div style="display:flex; justify-content:space-between; gap:${u(16)}; ${entry.kind === 'ttc' ? 'font-weight:700;' : `color:${MUTED};`}"><span style="font-style:italic">${escapeHtml(entry.label)}</span><span>${escapeHtml(entry.value)}</span></div>`,
        )
        .join('')}
      <div style="border-top:${u(0.75)} solid ${INK}; border-bottom:${u(0.75)} solid ${INK}; margin-top:${u(8)}; padding:${u(8)} 0; display:flex; justify-content:space-between; align-items:baseline; gap:${u(16)}">
        <span style="font-size:${u(10)}; letter-spacing:${u(2)}; text-transform:uppercase">${escapeHtml(labels.amountDue)}</span>
        <span style="font-size:${u(18)}; font-weight:700; color:${RULE}">${escapeHtml(totals.amountDue)}</span>
      </div>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:${u(24)}; margin-top:${u(30)}">
      <div style="flex:1; font-size:${u(10.5)}; line-height:1.7">
        ${hasPayment ? `${small(escapeHtml(labels.payment))}<div style="margin-top:${u(3)}">${joinLines(payment)}</div>` : ''}
        ${context.notes ? `<div style="margin-top:${u(12)}; font-style:italic; color:${MUTED}">${escapeHtml(context.notes)}</div>` : ''}
      </div>
      ${qrSlot(context.qrSvg, 60)}
    </div>
  </div>

  <div class="dc-spacer"></div>
  ${context.legalMentions.length > 0 ? `<div style="border-top:${u(0.5)} solid #CFCAC2; padding-top:${u(10)}; font-size:${u(8.5)}; line-height:1.7; color:${MUTED}; text-align:center">${joinLines(context.legalMentions)}</div>` : ''}
</div>`;
}

export const template40: PdfTemplateDefinition = {
  id: '40',
  name: 'Honoraires',
  description: 'Note d’honoraires sobre : filet vertical, en-tête de papier à lettres et prestations en paragraphes numérotés.',
  accent: RULE,
  paper: PAPER,
  render,
  vocabulary: 'formal',
  category: 'classique',
  ownsLegalIds: true,
};
