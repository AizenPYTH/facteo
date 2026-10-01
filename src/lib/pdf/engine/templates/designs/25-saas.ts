import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, legalIdsText, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const INK = '#30313D';
const MUTED = '#6A7383';
const LINE = '#EBEEF1';
const ACCENT = '#635BFF';

/** Facture de logiciel en ligne : montant dû en très grand, grille de métadonnées grises. */
function render(context: TemplateContext): string {
  const { issuer, client, labels, totals } = context;
  const legal = legalIdsText(context);
  const dueEntry = context.meta.find((entry) => entry.strong);

  return `<div class="dc-page" style="font-family:${FONTS.workSans}; color:${INK}; background:#fff; padding:${u(52)} ${u(56)}">
  <div style="display:flex; justify-content:space-between; align-items:center">
    <div style="font-size:${u(26)}; font-weight:700">${escapeHtml(labels.document)}</div>
    ${context.logoUrl ? `<img src="${escapeHtml(context.logoUrl)}" alt="" style="max-height:${u(36)}; max-width:${u(170)}" />` : `<div style="font-size:${u(15)}; font-weight:700">${escapeHtml(issuer.name)}</div>`}
  </div>

  <table style="margin-top:${u(18)}; font-size:${u(11.5)}; border-collapse:collapse">
    <tr><td style="color:${MUTED}; padding:${u(2)} ${u(26)} ${u(2)} 0">${escapeHtml(labels.number)}</td><td>${escapeHtml(context.number)}</td></tr>
    ${context.meta.map((entry) => `<tr><td style="color:${MUTED}; padding:${u(2)} ${u(26)} ${u(2)} 0">${escapeHtml(entry.label)}</td><td>${escapeHtml(entry.value)}</td></tr>`).join('')}
  </table>

  <div style="display:flex; gap:${u(40)}; margin-top:${u(28)}; font-size:${u(11.5)}; line-height:1.6">
    <div style="flex:1">
      <div style="font-weight:600">${escapeHtml(issuer.name)}</div>
      <div style="color:${MUTED}">${joinLines([...issuer.addressLines, issuer.phone, issuer.email])}</div>
      ${legal ? `<div style="color:${MUTED}; font-size:${u(10)}; margin-top:${u(4)}">${escapeHtml(legal)}</div>` : ''}
    </div>
    <div style="flex:1">
      <div style="color:${MUTED}">${escapeHtml(labels.billedTo)}</div>
      <div style="font-weight:600">${escapeHtml(client.name)}</div>
      <div style="color:${MUTED}">${joinLines([...client.addressLines, client.email, client.vatNumber ? `TVA ${client.vatNumber}` : ''])}</div>
    </div>
  </div>

  <div style="margin-top:${u(34)}; font-size:${u(24)}; font-weight:700">${escapeHtml(totals.amountDue)} ${
    dueEntry ? `<span style="font-weight:600">${escapeHtml(dueEntry.label.toLowerCase())} ${escapeHtml(dueEntry.value)}</span>` : ''
  }</div>
  ${context.payment.iban ? `<div style="margin-top:${u(6)}; font-size:${u(11.5)}; color:${ACCENT}; font-weight:600">Payer par virement →</div>` : ''}

  <table style="width:100%; border-collapse:collapse; margin-top:${u(30)}; font-size:${u(11)}">
    <thead><tr style="color:${MUTED}; border-bottom:${u(1)} solid ${LINE}">
      <th style="text-align:left; font-weight:500; padding:${u(7)} 0">${escapeHtml(labels.designation)}</th>
      <th style="text-align:right; font-weight:500; padding:${u(7)} 0; width:${u(70)}">${escapeHtml(labels.quantity)}</th>
      <th style="text-align:right; font-weight:500; padding:${u(7)} 0; width:${u(100)}">${escapeHtml(labels.unitPrice)}</th>
      <th style="text-align:right; font-weight:500; padding:${u(7)} 0; width:${u(60)}">${escapeHtml(labels.vat)}</th>
      <th style="text-align:right; font-weight:500; padding:${u(7)} 0; width:${u(100)}">${escapeHtml(labels.totalHt)}</th>
    </tr></thead>
    <tbody>${context.lines
      .map(
        (line) => `<tr style="border-bottom:${u(1)} solid ${LINE}">
        <td style="padding:${u(10)} 0">${escapeHtml(line.title)}${line.description ? `<div style="color:${MUTED}; font-size:${u(10)}">${escapeHtml(line.description)}</div>` : ''}</td>
        <td style="text-align:right; padding:${u(10)} 0">${quantityText(line)}</td>
        <td style="text-align:right; padding:${u(10)} 0">${escapeHtml(line.unitPrice)}</td>
        <td style="text-align:right; padding:${u(10)} 0; color:${MUTED}">${escapeHtml(line.vatRate)}</td>
        <td style="text-align:right; padding:${u(10)} 0">${escapeHtml(line.totalHt)}</td>
      </tr>`,
      )
      .join('')}</tbody>
  </table>

  <div class="dc-keep" style="margin:${u(8)} 0 0 auto; width:${u(320)}; font-size:${u(11.5)}">
    ${totalsList(context)
      .map(
        (entry) =>
          `<div style="display:flex; justify-content:space-between; padding:${u(8)} 0; border-bottom:${u(1)} solid ${LINE}; ${entry.kind === 'final' ? 'font-weight:700;' : ''}"><span style="${entry.kind === 'row' ? `color:${MUTED}` : ''}">${escapeHtml(entry.label)}</span><span>${escapeHtml(entry.value)}</span></div>`,
      )
      .join('')}
  </div>

  ${context.notes ? `<div style="margin-top:${u(24)}; font-size:${u(11)}; color:${MUTED}; line-height:1.6">${escapeHtml(context.notes)}</div>` : ''}

  <div class="dc-spacer"></div>
  <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:${u(24)}; border-top:${u(1)} solid ${LINE}; padding-top:${u(16)}">
    <div style="font-size:${u(10)}; color:${MUTED}; line-height:1.7">${joinLines([context.payment.terms, ...paymentLines(context), ...context.legalMentions])}</div>
    ${qrSlot(context.qrSvg, 64)}
  </div>
</div>`;
}

export const template25: PdfTemplateDefinition = {
  id: '25',
  name: 'En ligne',
  description: 'Facture de logiciel en ligne : montant dû en grand, métadonnées grises, très aérée.',
  accent: '#635BFF',
  paper: '#FFFFFF',
  render,
  vocabulary: 'studio',
  category: 'tech',
  ownsLegalIds: true,
};
