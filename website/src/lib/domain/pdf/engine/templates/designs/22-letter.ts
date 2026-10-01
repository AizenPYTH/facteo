import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import {
  joinLines,
  legalIdsText,
  paymentLines,
  quantityText,
  totalsList,
} from '@/lib/pdf/engine/templates/designs/kit';

const INK = '#1F1B16';
const SOFT = '#6B635A';

/** Lettre à fenêtre : expéditeur en haut, destinataire à droite, objet et formule. */
function render(context: TemplateContext): string {
  const { issuer, client, labels } = context;
  const city = issuer.addressLines[1]?.replace(/^\d{4,5}\s*/, '') ?? '';
  const issuedAt = context.issuedAt ?? '';

  return `<div class="dc-page" style="font-family:${FONTS.lora}; color:${INK}; background:#FFFDF9; padding:${u(56)} ${u(70)} ${u(48)}">
  <div style="display:flex; justify-content:space-between; align-items:flex-start">
    <div style="font-size:${u(11)}; line-height:1.65">
      ${context.logoUrl ? `<img src="${escapeHtml(context.logoUrl)}" alt="" style="max-height:${u(46)}; max-width:${u(200)}; margin-bottom:${u(10)}; display:block" />` : ''}
      <div style="font-size:${u(14)}; font-weight:700">${escapeHtml(issuer.name)}</div>
      ${joinLines([...issuer.addressLines, issuer.phone, issuer.email])}
    </div>
    <div style="font-size:${u(10)}; color:${SOFT}; text-align:right; line-height:1.6; max-width:${u(230)}">${joinLines(
      context.issuerLegalIds.map((entry) => `${entry.label} ${entry.value}`),
    )}</div>
  </div>

  <div style="margin:${u(40)} 0 0 ${u(360)}; font-size:${u(12)}; line-height:1.65">
    <div style="font-weight:700">${escapeHtml(client.name)}</div>
    ${joinLines([client.contactName ? `À l’attention de ${client.contactName}` : '', ...client.addressLines])}
  </div>

  <div style="margin-top:${u(40)}; font-size:${u(11.5)}">${city ? `${escapeHtml(city)}, le ` : 'Le '}${escapeHtml(issuedAt)}</div>
  <div style="margin-top:${u(18)}; font-size:${u(12.5)}"><span style="font-weight:700">Objet :</span> ${escapeHtml(
    labels.document,
  )} n° ${escapeHtml(context.number)}</div>

  <p style="font-size:${u(11.5)}; line-height:1.75; margin:${u(18)} 0 ${u(16)}">Madame, Monsieur,<br/>Veuillez trouver ci-dessous le détail de notre ${escapeHtml(
    labels.document.toLowerCase(),
  )}${context.secondaryDate ? `, ${escapeHtml(labels.secondaryDate.toLowerCase())} : ${escapeHtml(context.secondaryDate)}` : ''}.</p>

  <table style="width:100%; font-size:${u(11)}; border-collapse:collapse">
    <thead><tr style="border-bottom:${u(1)} solid ${INK}">
      <th style="text-align:left; padding:${u(6)} 0; font-weight:700">${escapeHtml(labels.designation)}</th>
      <th style="text-align:right; padding:${u(6)} 0; font-weight:700; width:${u(80)}">${escapeHtml(labels.quantity)}</th>
      <th style="text-align:right; padding:${u(6)} 0; font-weight:700; width:${u(100)}">${escapeHtml(labels.unitPrice)}</th>
      <th style="text-align:right; padding:${u(6)} 0; font-weight:700; width:${u(100)}">${escapeHtml(labels.totalHt)}</th>
    </tr></thead>
    <tbody>${context.lines
      .map(
        (line) => `<tr style="border-bottom:${u(0.5)} dotted #B8AEA2">
          <td style="padding:${u(7)} 0; vertical-align:top">${escapeHtml(line.title)}${
            line.description ? `<div style="font-size:${u(10)}; color:${SOFT}; font-style:italic">${escapeHtml(line.description)}</div>` : ''
          }</td>
          <td style="text-align:right; padding:${u(7)} 0; vertical-align:top">${quantityText(line)}</td>
          <td style="text-align:right; padding:${u(7)} 0; vertical-align:top">${escapeHtml(line.unitPrice)}</td>
          <td style="text-align:right; padding:${u(7)} 0; vertical-align:top">${escapeHtml(line.totalHt)}</td>
        </tr>`,
      )
      .join('')}</tbody>
  </table>

  <div class="dc-keep" style="margin:${u(14)} 0 0 auto; width:${u(280)}; font-size:${u(11.5)}">
    ${totalsList(context)
      .map(
        (entry) =>
          `<div style="display:flex; justify-content:space-between; padding:${u(3)} 0; ${
            entry.kind === 'final' ? `font-weight:700; font-size:${u(13.5)}; border-top:${u(1)} solid ${INK}; margin-top:${u(4)}; padding-top:${u(7)};` : ''
          }"><span>${escapeHtml(entry.label)}</span><span>${escapeHtml(entry.value)}</span></div>`,
      )
      .join('')}
  </div>

  <p style="font-size:${u(11.5)}; line-height:1.75; margin-top:${u(20)}">${
    context.payment.terms ? `${escapeHtml(context.payment.terms)}. ` : ''
  }${paymentLines(context).length > 0 ? `Règlement possible par : ${joinLines(paymentLines(context), ' — ')}.` : ''}</p>
  ${context.notes ? `<p style="font-size:${u(11.5)}; line-height:1.75">${escapeHtml(context.notes)}</p>` : ''}
  <p style="font-size:${u(11.5)}; line-height:1.75">Nous vous prions d’agréer, Madame, Monsieur, l’expression de nos salutations distinguées.</p>

  <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:${u(10)}">
    ${qrSlot(context.qrSvg, 70)}
    <div style="text-align:right; font-size:${u(12)}">
      <div style="font-family:${FONTS.caveat}; font-size:${u(24)}">${escapeHtml(issuer.name)}</div>
    </div>
  </div>

  <div class="dc-spacer"></div>
  ${
    context.legalMentions.length > 0 || legalIdsText(context)
      ? `<div style="border-top:${u(0.5)} solid #CFC6BA; padding-top:${u(10)}; font-size:${u(8.5)}; color:${SOFT}; text-align:center; line-height:1.6">${joinLines(
          context.legalMentions,
        )}</div>`
      : ''
  }
</div>`;
}

export const template22: PdfTemplateDefinition = {
  id: '22',
  name: 'Lettre',
  description: 'Courrier traditionnel : en-tête, destinataire à fenêtre, objet, formule de politesse.',
  accent: '#1F1B16',
  paper: '#FFFDF9',
  render,
  vocabulary: 'formal',
  category: 'classique',
  ownsLegalIds: true,
};
