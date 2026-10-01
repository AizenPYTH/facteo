import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const INK = '#2A2724';

/** Tapé à la machine : tout en Courier, capitales, filets en tirets, tampon de date. */
function render(context: TemplateContext): string {
  const { issuer, client, labels } = context;
  const rule = (char = '-') =>
    `<div style="overflow:hidden; white-space:nowrap; letter-spacing:${u(1)}; color:#8A847C; margin:${u(10)} 0">${char.repeat(120)}</div>`;
  const pad = (label: string) => escapeHtml(label.toUpperCase());

  return `<div class="dc-page" style="font-family:${FONTS.courier}; color:${INK}; background:#F7F3EA; padding:${u(56)} ${u(64)}; font-size:${u(11.5)}; line-height:1.55">
  <div style="text-align:center; font-weight:700; font-size:${u(14)}; letter-spacing:${u(4)}">${pad(issuer.name)}</div>
  <div style="text-align:center">${joinLines(issuer.addressLines, ' - ')}</div>
  ${context.issuerLegalIds.length ? `<div style="text-align:center">${joinLines(context.issuerLegalIds.map((entry) => `${entry.label} : ${entry.value}`), ' - ')}</div>` : ''}
  ${rule('=')}
  <div style="display:flex; justify-content:space-between">
    <div><b>${pad(labels.document)} ${escapeHtml(labels.number)} ${escapeHtml(context.number)}</b></div>
    <div style="border:${u(2)} solid #9C2B23; color:#9C2B23; padding:0 ${u(8)}; transform:rotate(-3deg); font-weight:700">${escapeHtml(context.issuedAt ?? '')}</div>
  </div>
  ${context.meta.filter((entry) => entry.label !== labels.issuedAt).map((entry) => `<div>${pad(entry.label)} ......... ${escapeHtml(entry.value)}</div>`).join('')}
  ${rule()}
  <div>${pad(labels.billedTo)} :</div>
  <div style="padding-left:${u(40)}"><b>${escapeHtml(client.name)}</b><br/>${joinLines([client.contactName ?? '', ...client.addressLines])}</div>
  ${rule()}
  <table style="width:100%; border-collapse:collapse; font-size:${u(11)}">
    <thead><tr>
      <th style="text-align:left; font-weight:700; padding-bottom:${u(4)}">${pad(labels.designation)}</th>
      <th style="text-align:right; font-weight:700; width:${u(70)}">${pad(labels.quantity)}</th>
      <th style="text-align:right; font-weight:700; width:${u(110)}">${pad(labels.unitPrice)}</th>
      <th style="text-align:right; font-weight:700; width:${u(110)}">${pad(labels.totalHt)}</th>
    </tr></thead>
    <tbody>${context.lines
      .map(
        (line) => `<tr>
        <td style="padding:${u(3)} 0; vertical-align:top">${escapeHtml(line.title)}${line.description ? `<br/><span style="padding-left:${u(16)}">${escapeHtml(line.description)}</span>` : ''}</td>
        <td style="text-align:right; vertical-align:top">${quantityText(line)}</td>
        <td style="text-align:right; vertical-align:top">${escapeHtml(line.unitPrice)}</td>
        <td style="text-align:right; vertical-align:top">${escapeHtml(line.totalHt)}</td>
      </tr>`,
      )
      .join('')}</tbody>
  </table>
  ${rule()}
  <div class="dc-keep" style="margin-left:auto; width:${u(330)}">
    ${totalsList(context)
      .map(
        (entry) =>
          `<div style="display:flex; justify-content:space-between; ${entry.kind === 'final' ? 'font-weight:700; text-decoration:underline;' : ''}"><span>${pad(entry.label)}</span><span>${escapeHtml(entry.value)}</span></div>`,
      )
      .join('')}
  </div>
  ${rule('=')}
  <div>${joinLines([context.payment.terms, ...paymentLines(context)])}</div>
  ${context.notes ? `<div style="margin-top:${u(8)}">N.B. ${escapeHtml(context.notes)}</div>` : ''}

  <div class="dc-spacer"></div>
  <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:${u(20)}; font-size:${u(9)}">
    <div>${joinLines(context.legalMentions)}</div>
    ${qrSlot(context.qrSvg, 62)}
  </div>
</div>`;
}

export const template27: PdfTemplateDefinition = {
  id: '27',
  name: 'Machine à écrire',
  description: 'Document tapé à la machine : Courier, capitales, filets de tirets, tampon dateur.',
  accent: '#9C2B23',
  paper: '#F7F3EA',
  render,
  vocabulary: 'formal',
  category: 'elegant',
  ownsLegalIds: true,
};
