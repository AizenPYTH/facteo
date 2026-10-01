import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, legalIdsText, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const NAVY = '#1F2A44';
const GOLD = '#D9B26F';
const INK = '#1C2233';
const MUTED = '#6E7587';
const PALE = 'rgba(255,255,255,0.62)';
const RULE = 'rgba(255,255,255,0.16)';
const SIDE = 250;

/** Colonne : barre latérale marine pleine hauteur pour les coordonnées, contenu à droite. */
function render(context: TemplateContext): string {
  const { issuer, client, labels, totals } = context;
  const legal = joinLines(legalIdsText(context, '\n').split('\n'));
  const payment = [context.payment.terms, ...paymentLines(context)];
  const hasPayment = payment.some(Boolean);

  const sideTitle = (text: string) =>
    `<div style="font-size:${u(8.5)}; font-weight:700; letter-spacing:${u(1.8)}; text-transform:uppercase; color:${GOLD}; margin-bottom:${u(6)}">${escapeHtml(text)}</div>`;
  const sideBlock = (content: string) =>
    `<div style="padding:${u(16)} 0; border-top:${u(1)} solid ${RULE}">${content}</div>`;

  return `<div class="dc-page" style="flex-direction:row; font-family:${FONTS.jakarta}; color:${INK}; background:linear-gradient(90deg, ${NAVY} 0 ${u(SIDE)}, #FFFFFF ${u(SIDE)} 100%)">
  <div style="width:${u(SIDE)}; flex-shrink:0; background:${NAVY}; color:#fff; padding:${u(44)} ${u(28)} ${u(32)}; display:flex; flex-direction:column; font-size:${u(10.5)}; line-height:1.6">
    ${context.logoUrl ? `<div style="background:#fff; border-radius:${u(6)}; padding:${u(10)}; margin-bottom:${u(18)}; display:inline-block; align-self:flex-start"><img src="${escapeHtml(context.logoUrl)}" alt="" style="display:block; max-height:${u(44)}; max-width:${u(170)}" /></div>` : ''}
    <div style="padding-bottom:${u(16)}">
      ${sideTitle(labels.issuer)}
      <div style="font-family:${FONTS.dmSerif}; font-size:${u(20)}; line-height:1.15; margin-bottom:${u(6)}">${escapeHtml(issuer.name)}</div>
      <div style="color:${PALE}">${joinLines([...issuer.addressLines, issuer.phone, issuer.email])}</div>
      ${legal ? `<div style="color:${PALE}; font-size:${u(9)}; margin-top:${u(6)}">${legal}</div>` : ''}
    </div>
    ${sideBlock(`${sideTitle(labels.billedTo)}
      <div style="font-weight:700; font-size:${u(12.5)}">${escapeHtml(client.name)}</div>
      ${client.contactName ? `<div style="color:${PALE}">${escapeHtml(client.contactName)}</div>` : ''}
      <div style="color:${PALE}">${joinLines(client.addressLines)}</div>
      ${client.vatNumber ? `<div style="color:${PALE}; font-size:${u(9)}; margin-top:${u(4)}">TVA ${escapeHtml(client.vatNumber)}</div>` : ''}`)}
    ${
      context.meta.length > 0
        ? sideBlock(
            context.meta
              .map(
                (entry) => `<div style="margin-bottom:${u(8)}">
          <div style="font-size:${u(8.5)}; letter-spacing:${u(1.2)}; text-transform:uppercase; color:${PALE}">${escapeHtml(entry.label)}</div>
          <div style="font-weight:${entry.strong ? 800 : 600}; font-size:${u(12)}; ${entry.strong ? `color:${GOLD};` : ''}">${escapeHtml(entry.value)}</div></div>`,
              )
              .join(''),
          )
        : ''
    }
    ${hasPayment ? sideBlock(`${sideTitle(labels.payment)}<div style="color:${PALE}; font-size:${u(9.5)}; word-break:break-word">${joinLines(payment)}</div>`) : ''}
    ${context.qrSvg ? `<div style="margin-top:${u(4)}; background:#fff; padding:${u(6)}; border-radius:${u(6)}; align-self:flex-start">${qrSlot(context.qrSvg, 64)}</div>` : ''}
  </div>

  <div style="flex:1; min-width:0; display:flex; flex-direction:column; padding:${u(44)} ${u(40)} ${u(32)} ${u(36)}; background:#fff">
    <div style="font-size:${u(10)}; letter-spacing:${u(2.4)}; text-transform:uppercase; color:${MUTED}; font-weight:700">${escapeHtml(labels.number)} ${escapeHtml(context.number)}</div>
    <div style="font-family:${FONTS.dmSerif}; font-size:${u(50)}; line-height:1; color:${NAVY}; margin-top:${u(6)}">${escapeHtml(labels.document)}</div>
    <div style="width:${u(56)}; height:${u(4)}; background:${GOLD}; margin-top:${u(14)}"></div>

    <table style="width:100%; border-collapse:collapse; table-layout:fixed; margin-top:${u(30)}; font-size:${u(10.5)}">
      <thead><tr>
        ${[
          [labels.designation, 'left', 0],
          [labels.quantity, 'right', 58],
          [labels.unitPrice, 'right', 78],
          [labels.vat, 'right', 44],
          [labels.totalHt, 'right', 84],
        ]
          .map(
            ([label, align, width]) =>
              `<th style="${width ? `width:${u(Number(width))};` : ''} text-align:${align}; padding:0 0 ${u(8)}; border-bottom:${u(2)} solid ${NAVY}; font-size:${u(8.5)}; font-weight:700; letter-spacing:${u(1)}; text-transform:uppercase; color:${NAVY}">${escapeHtml(String(label))}</th>`,
          )
          .join('')}
      </tr></thead>
      <tbody>${context.lines
        .map(
          (line) => `<tr>
          <td style="padding:${u(10)} ${u(8)} ${u(10)} 0; border-bottom:${u(1)} solid #E6E8EE; vertical-align:top"><div style="font-weight:700">${escapeHtml(line.title)}</div>${line.description ? `<div style="font-size:${u(9.5)}; color:${MUTED}; margin-top:${u(2)}; line-height:1.45">${escapeHtml(line.description)}</div>` : ''}</td>
          <td style="padding:${u(10)} 0; border-bottom:${u(1)} solid #E6E8EE; text-align:right; vertical-align:top">${quantityText(line)}</td>
          <td style="padding:${u(10)} 0; border-bottom:${u(1)} solid #E6E8EE; text-align:right; vertical-align:top">${escapeHtml(line.unitPrice)}</td>
          <td style="padding:${u(10)} 0; border-bottom:${u(1)} solid #E6E8EE; text-align:right; vertical-align:top; color:${MUTED}">${escapeHtml(line.vatRate)}</td>
          <td style="padding:${u(10)} 0; border-bottom:${u(1)} solid #E6E8EE; text-align:right; vertical-align:top; font-weight:700">${escapeHtml(line.totalHt)}</td>
        </tr>`,
        )
        .join('')}</tbody>
    </table>

    <div class="dc-keep" style="margin:${u(22)} 0 0 auto; width:${u(290)}; font-size:${u(10.5)}">
      ${totalsList(context)
        .filter((entry) => entry.kind !== 'final')
        .map(
          (entry) => `<div style="display:flex; justify-content:space-between; padding:${u(5)} 0; ${entry.kind === 'ttc' ? `font-weight:700; color:${NAVY};` : `color:${MUTED};`}"><span>${escapeHtml(entry.label)}</span><span>${escapeHtml(entry.value)}</span></div>`,
        )
        .join('')}
      <div style="margin-top:${u(10)}; background:${NAVY}; color:#fff; padding:${u(14)} ${u(16)}; border-left:${u(5)} solid ${GOLD}">
        <div style="font-size:${u(8.5)}; letter-spacing:${u(1.6)}; text-transform:uppercase; color:${GOLD}; font-weight:700">${escapeHtml(labels.amountDue)}</div>
        <div style="font-family:${FONTS.dmSerif}; font-size:${u(28)}; margin-top:${u(2)}">${escapeHtml(totals.amountDue)}</div>
      </div>
    </div>

    ${context.notes ? `<div style="margin-top:${u(22)}; padding-left:${u(12)}; border-left:${u(2)} solid ${GOLD}; font-size:${u(10)}; line-height:1.6; color:${MUTED}">${escapeHtml(context.notes)}</div>` : ''}

    <div class="dc-spacer"></div>
    ${context.legalMentions.length > 0 ? `<div style="border-top:${u(1)} solid #E6E8EE; padding-top:${u(10)}; font-size:${u(8.5)}; line-height:1.6; color:${MUTED}">${joinLines(context.legalMentions)}</div>` : ''}
  </div>
</div>`;
}

export const template39: PdfTemplateDefinition = {
  id: '39',
  name: 'Colonne',
  description: 'Colonne marine pleine hauteur pour les coordonnées, contenu aéré et titres DM Serif à droite.',
  accent: NAVY,
  paper: '#FFFFFF',
  render,
  vocabulary: 'corporate',
  category: 'moderne',
  ownsLegalIds: true,
};
