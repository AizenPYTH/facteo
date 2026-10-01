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

const INK = '#222';
const DASH = `${u(1)} dashed #999`;

function dashed(): string {
  return `<div style="border-top:${DASH}; margin:${u(14)} 0"></div>`;
}

function row(left: string, right: string, options: { bold?: boolean; size?: number } = {}): string {
  return `<div style="display:flex; justify-content:space-between; gap:${u(12)}; font-size:${u(
    options.size ?? 11,
  )}; ${options.bold ? 'font-weight:700;' : ''} line-height:1.6"><span>${left}</span><span style="white-space:nowrap">${right}</span></div>`;
}

/** Ticket de caisse : colonne étroite centrée, tout en machine, filets pointillés. */
function render(context: TemplateContext): string {
  const { issuer, client, labels } = context;
  const legal = legalIdsText(context, '<br/>');

  return `<div class="dc-page" style="font-family:${FONTS.spaceMono}; color:${INK}; background:#EDEDED; padding:${u(40)} 0">
  <div style="width:${u(400)}; margin:0 auto; background:#fff; padding:${u(30)} ${u(30)} ${u(34)}; box-shadow:0 ${u(2)} ${u(10)} rgba(0,0,0,.08)">
    <div style="text-align:center">
      ${context.logoUrl ? `<img src="${escapeHtml(context.logoUrl)}" alt="" style="max-height:${u(44)}; max-width:${u(180)}; margin-bottom:${u(8)}" />` : ''}
      <div style="font-size:${u(16)}; font-weight:700; text-transform:uppercase; letter-spacing:${u(1)}">${escapeHtml(issuer.name)}</div>
      <div style="font-size:${u(10)}; line-height:1.6; margin-top:${u(4)}">${joinLines([...issuer.addressLines, issuer.phone])}</div>
      ${legal ? `<div style="font-size:${u(9.5)}; line-height:1.6; margin-top:${u(4)}; color:#555">${legal}</div>` : ''}
    </div>
    ${dashed()}
    <div style="text-align:center; font-size:${u(13)}; font-weight:700; letter-spacing:${u(2)}">${escapeHtml(labels.documentUpper)}</div>
    <div style="text-align:center; font-size:${u(11)}; margin-top:${u(2)}">${escapeHtml(labels.number)} ${escapeHtml(context.number)}</div>
    <div style="margin-top:${u(10)}">
      ${context.meta.map((entry) => row(escapeHtml(entry.label), escapeHtml(entry.value), { size: 10 })).join('')}
    </div>
    ${dashed()}
    <div style="font-size:${u(10)}; line-height:1.6">
      <div style="font-weight:700">${escapeHtml(labels.billedTo).toUpperCase()}</div>
      <div>${escapeHtml(client.name)}</div>
      ${joinLines(client.addressLines)}
    </div>
    ${dashed()}
    ${context.lines
      .map(
        (line) => `<div style="margin-bottom:${u(8)}">
          <div style="font-size:${u(11)}; font-weight:700">${escapeHtml(line.title)}</div>
          ${line.description ? `<div style="font-size:${u(9.5)}; color:#555">${escapeHtml(line.description)}</div>` : ''}
          ${row(`${quantityText(line)} × ${escapeHtml(line.unitPrice)}`, escapeHtml(line.totalHt), { size: 10.5 })}
        </div>`,
      )
      .join('')}
    ${dashed()}
    <div class="dc-keep">
      ${totalsList(context)
        .map((entry) =>
          entry.kind === 'final'
            ? `<div style="border-top:${u(2)} solid ${INK}; margin-top:${u(8)}; padding-top:${u(8)}">${row(
                escapeHtml(entry.label).toUpperCase(),
                escapeHtml(entry.value),
                { bold: true, size: 15 },
              )}</div>`
            : row(escapeHtml(entry.label), escapeHtml(entry.value), { bold: entry.kind === 'ttc' }),
        )
        .join('')}
    </div>
    ${
      paymentLines(context).length > 0
        ? `${dashed()}<div style="font-size:${u(9.5)}; line-height:1.6"><div style="font-weight:700">${escapeHtml(
            labels.payment,
          ).toUpperCase()}</div>${joinLines(paymentLines(context))}</div>`
        : ''
    }
    ${context.qrSvg ? `<div style="display:flex; justify-content:center; margin-top:${u(14)}">${qrSlot(context.qrSvg, 90)}</div>` : ''}
    ${context.notes ? `${dashed()}<div style="font-size:${u(9.5)}; line-height:1.6; text-align:center">${escapeHtml(context.notes)}</div>` : ''}
    ${dashed()}
    <div style="text-align:center; font-size:${u(11)}; font-weight:700; letter-spacing:${u(3)}">*** MERCI ***</div>
    <div style="height:${u(34)}; margin-top:${u(14)}; background:repeating-linear-gradient(90deg, ${INK} 0 ${u(2)}, transparent ${u(2)} ${u(4)}, ${INK} ${u(4)} ${u(5)}, transparent ${u(5)} ${u(8)})"></div>
    ${
      context.legalMentions.length > 0
        ? `<div style="font-size:${u(8.5)}; line-height:1.5; color:#666; margin-top:${u(12)}; text-align:center">${joinLines(
            context.legalMentions,
          )}</div>`
        : ''
    }
  </div>
  <div class="dc-spacer"></div>
</div>`;
}

export const template21: PdfTemplateDefinition = {
  id: '21',
  name: 'Ticket',
  description: 'Ticket de caisse : colonne étroite, police machine, filets pointillés et code-barres.',
  accent: null,
  paper: '#EDEDED',
  render,
  vocabulary: 'retail',
  category: 'commerce',
  ownsLegalIds: true,
};
