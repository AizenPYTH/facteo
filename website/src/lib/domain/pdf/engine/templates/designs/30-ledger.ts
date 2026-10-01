import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, legalIdsText, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const INK = '#1E2B22';
const GREEN = '#E3F0E3';
const RULE = '#7FA88A';

/** Grand livre : papier listing à bandes vertes, chiffres en machine, colonnes doubles. */
function render(context: TemplateContext): string {
  const { issuer, client, labels } = context;
  const cell = `padding:${u(5)} ${u(8)}; border-right:${u(1)} solid ${RULE}`;

  return `<div class="dc-page" style="font-family:${FONTS.plexSans}; color:${INK}; background:#fff; padding:${u(40)} ${u(44)}">
  <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:${u(3)} double ${INK}; padding-bottom:${u(8)}">
    <div>
      <div style="font-size:${u(16)}; font-weight:700">${escapeHtml(issuer.name)}</div>
      <div style="font-size:${u(10)}; line-height:1.5">${joinLines(issuer.addressLines, ' — ')}</div>
      ${legalIdsText(context) ? `<div style="font-family:${FONTS.spaceMono}; font-size:${u(9.5)}">${escapeHtml(legalIdsText(context, '  |  '))}</div>` : ''}
    </div>
    <div style="text-align:right">
      <div style="font-size:${u(11)}; text-transform:uppercase; letter-spacing:${u(2)}">${escapeHtml(labels.document)}</div>
      <div style="font-family:${FONTS.spaceMono}; font-size:${u(18)}; font-weight:700">${escapeHtml(context.number)}</div>
    </div>
  </div>

  <div style="display:flex; gap:${u(30)}; margin-top:${u(14)}; font-size:${u(10.5)}; line-height:1.55">
    <div style="flex:1"><div style="font-weight:700; text-transform:uppercase; font-size:${u(9)}">${escapeHtml(labels.billedTo)}</div><b>${escapeHtml(client.name)}</b><br/>${joinLines(client.addressLines)}</div>
    <table style="font-family:${FONTS.spaceMono}; font-size:${u(10)}; border-collapse:collapse">
      ${context.meta.map((entry) => `<tr><td style="padding:${u(1)} ${u(12)} ${u(1)} 0; text-transform:uppercase">${escapeHtml(entry.label)}</td><td style="text-align:right">${escapeHtml(entry.value)}</td></tr>`).join('')}
    </table>
  </div>

  <table style="width:100%; border-collapse:collapse; margin-top:${u(18)}; font-size:${u(10.5)}; border:${u(1.5)} solid ${INK}">
    <thead><tr style="background:${INK}; color:#fff; font-size:${u(9)}; text-transform:uppercase; letter-spacing:${u(1)}">
      <th style="${cell}; text-align:left; width:${u(34)}">N°</th>
      <th style="${cell}; text-align:left">${escapeHtml(labels.designation)}</th>
      <th style="${cell}; text-align:right; width:${u(70)}">${escapeHtml(labels.quantity)}</th>
      <th style="${cell}; text-align:right; width:${u(96)}">${escapeHtml(labels.unitPrice)}</th>
      <th style="${cell}; text-align:right; width:${u(56)}">${escapeHtml(labels.vat)}</th>
      <th style="padding:${u(5)} ${u(8)}; text-align:right; width:${u(100)}">${escapeHtml(labels.totalHt)}</th>
    </tr></thead>
    <tbody>${context.lines
      .map(
        (line, index) => `<tr style="background:${index % 2 === 0 ? GREEN : '#fff'}">
        <td style="${cell}; font-family:${FONTS.spaceMono}">${String(line.index).padStart(3, '0')}</td>
        <td style="${cell}">${escapeHtml(line.title)}${line.description ? ` — <span style="opacity:.75">${escapeHtml(line.description)}</span>` : ''}</td>
        <td style="${cell}; text-align:right; font-family:${FONTS.spaceMono}">${quantityText(line)}</td>
        <td style="${cell}; text-align:right; font-family:${FONTS.spaceMono}">${escapeHtml(line.unitPrice)}</td>
        <td style="${cell}; text-align:right; font-family:${FONTS.spaceMono}">${escapeHtml(line.vatRate)}</td>
        <td style="padding:${u(5)} ${u(8)}; text-align:right; font-family:${FONTS.spaceMono}">${escapeHtml(line.totalHt)}</td>
      </tr>`,
      )
      .join('')}</tbody>
  </table>

  <div class="dc-keep" style="display:flex; gap:${u(20)}; margin-top:${u(14)}; align-items:flex-start">
    <div style="flex:1; font-size:${u(10)}; line-height:1.6; border:${u(1)} dashed ${RULE}; padding:${u(8)} ${u(10)}">
      <b style="text-transform:uppercase; font-size:${u(9)}">${escapeHtml(labels.payment)}</b><br/>${joinLines([context.payment.terms, ...paymentLines(context)])}
      ${context.notes ? `<br/>${escapeHtml(context.notes)}` : ''}
    </div>
    <table style="width:${u(300)}; border-collapse:collapse; font-size:${u(10.5)}; font-family:${FONTS.spaceMono}">
      ${totalsList(context)
        .map(
          (entry) => `<tr style="${entry.kind === 'final' ? `border-top:${u(3)} double ${INK}; font-weight:700; font-size:${u(13)};` : `border-bottom:${u(0.5)} solid ${RULE};`}">
          <td style="padding:${u(4)} 0; text-transform:uppercase; font-family:${FONTS.plexSans}">${escapeHtml(entry.label)}</td>
          <td style="padding:${u(4)} 0; text-align:right">${escapeHtml(entry.value)}</td></tr>`,
        )
        .join('')}
    </table>
  </div>

  <div class="dc-spacer"></div>
  <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:${u(20)}; font-size:${u(8.5)}; line-height:1.6">
    <div>${joinLines(context.legalMentions)}</div>
    ${qrSlot(context.qrSvg, 62)}
  </div>
</div>`;
}

export const template30: PdfTemplateDefinition = {
  id: '30',
  name: 'Grand livre',
  description: 'Registre comptable : bandes vertes alternées, chiffres en machine, doubles filets.',
  accent: '#2E7D4F',
  paper: '#FFFFFF',
  render,
  vocabulary: 'ledger',
  category: 'classique',
  ownsLegalIds: true,
};
