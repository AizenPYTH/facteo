import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, legalIdsText, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const INK = '#1B1B1B';
const YELLOW = '#F5C400';

/** Chantier : bandeau hachuré jaune et noir, capitales condensées, cases de visa. */
function render(context: TemplateContext): string {
  const { issuer, client, labels, totals } = context;
  const hazard = `repeating-linear-gradient(135deg, ${YELLOW} 0 ${u(14)}, ${INK} ${u(14)} ${u(28)})`;
  const condensed = (text: string, size: number, weight = 700) =>
    `<span style="font-family:${FONTS.oswald}; font-size:${u(size)}; font-weight:${weight}; text-transform:uppercase; letter-spacing:${u(0.5)}">${text}</span>`;

  return `<div class="dc-page" style="font-family:${FONTS.workSans}; color:${INK}; background:#fff">
  <div style="height:${u(16)}; background:${hazard}"></div>
  <div style="display:flex; justify-content:space-between; align-items:flex-start; padding:${u(26)} ${u(40)} ${u(18)}">
    <div>
      ${context.logoUrl ? `<img src="${escapeHtml(context.logoUrl)}" alt="" style="max-height:${u(44)}; max-width:${u(200)}; display:block; margin-bottom:${u(6)}" />` : ''}
      ${condensed(escapeHtml(issuer.name), 24)}
      <div style="font-size:${u(10)}; line-height:1.55">${joinLines([...issuer.addressLines, issuer.phone])}</div>
      ${legalIdsText(context) ? `<div style="font-size:${u(9.5)}; font-weight:600; margin-top:${u(3)}">${escapeHtml(legalIdsText(context, ' • '))}</div>` : ''}
    </div>
    <div style="text-align:right">
      <div style="display:inline-block; background:${INK}; color:${YELLOW}; padding:${u(4)} ${u(14)}">${condensed(escapeHtml(labels.document), 34)}</div>
      <div style="margin-top:${u(6)}">${condensed(`${escapeHtml(labels.number)} ${escapeHtml(context.number)}`, 14, 500)}</div>
      ${context.meta.map((entry) => `<div style="font-size:${u(10)}">${escapeHtml(entry.label)} : <b>${escapeHtml(entry.value)}</b></div>`).join('')}
    </div>
  </div>

  <div style="margin:0 ${u(40)}; border:${u(2)} solid ${INK}; padding:${u(10)} ${u(14)}; font-size:${u(10.5)}; line-height:1.55">
    ${condensed(escapeHtml(labels.billedTo), 12)}<br/><b>${escapeHtml(client.name)}</b> — ${joinLines(client.addressLines, ', ')}
  </div>

  <table style="width:calc(100% - ${u(80)}); margin:${u(16)} ${u(40)} 0; border-collapse:collapse; font-size:${u(10.5)}">
    <thead><tr style="background:${YELLOW}">
      ${[labels.designation, labels.quantity, labels.unitPrice, labels.vat, labels.totalHt]
        .map(
          (label, index) =>
            `<th style="padding:${u(7)} ${u(8)}; border:${u(1.5)} solid ${INK}; text-align:${index === 0 ? 'left' : 'right'}">${condensed(escapeHtml(label), 11)}</th>`,
        )
        .join('')}
    </tr></thead>
    <tbody>${context.lines
      .map(
        (line) => `<tr>
        <td style="padding:${u(7)} ${u(8)}; border:${u(1)} solid #999"><b>${escapeHtml(line.title)}</b>${line.description ? `<div style="font-size:${u(9.5)}; color:#555">${escapeHtml(line.description)}</div>` : ''}</td>
        <td style="padding:${u(7)} ${u(8)}; border:${u(1)} solid #999; text-align:right; width:${u(80)}">${quantityText(line)}</td>
        <td style="padding:${u(7)} ${u(8)}; border:${u(1)} solid #999; text-align:right; width:${u(96)}">${escapeHtml(line.unitPrice)}</td>
        <td style="padding:${u(7)} ${u(8)}; border:${u(1)} solid #999; text-align:right; width:${u(56)}">${escapeHtml(line.vatRate)}</td>
        <td style="padding:${u(7)} ${u(8)}; border:${u(1)} solid #999; text-align:right; width:${u(100)}; font-weight:700">${escapeHtml(line.totalHt)}</td>
      </tr>`,
      )
      .join('')}</tbody>
  </table>

  <div class="dc-keep" style="display:flex; gap:${u(18)}; margin:${u(16)} ${u(40)} 0">
    <div style="flex:1; font-size:${u(10)}; line-height:1.6">
      ${condensed(escapeHtml(labels.payment), 12)}<br/>${joinLines([context.payment.terms, ...paymentLines(context)])}
      ${context.notes ? `<div style="margin-top:${u(6)}">${escapeHtml(context.notes)}</div>` : ''}
      <div style="display:flex; gap:${u(10)}; margin-top:${u(12)}">
        <div style="flex:1; border:${u(1.5)} solid ${INK}; height:${u(62)}; padding:${u(4)} ${u(6)}; font-size:${u(8.5)}; text-transform:uppercase">Visa entreprise</div>
        <div style="flex:1; border:${u(1.5)} solid ${INK}; height:${u(62)}; padding:${u(4)} ${u(6)}; font-size:${u(8.5)}; text-transform:uppercase">Visa client</div>
      </div>
    </div>
    <div style="width:${u(290)}; font-size:${u(11)}">
      ${totalsList(context)
        .filter((entry) => entry.kind !== 'final')
        .map((entry) => `<div style="display:flex; justify-content:space-between; padding:${u(4)} 0; border-bottom:${u(1)} solid #ccc"><span>${escapeHtml(entry.label)}</span><b>${escapeHtml(entry.value)}</b></div>`)
        .join('')}
      <div style="display:flex; justify-content:space-between; align-items:center; background:${INK}; color:${YELLOW}; padding:${u(8)} ${u(10)}; margin-top:${u(8)}">
        ${condensed(escapeHtml(labels.amountDue), 13)}${condensed(escapeHtml(totals.amountDue), 24)}
      </div>
    </div>
  </div>

  <div class="dc-spacer"></div>
  <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:${u(20)}; padding:0 ${u(40)} ${u(14)}; font-size:${u(8.5)}; line-height:1.6">
    <div>${joinLines(context.legalMentions)}</div>
    ${qrSlot(context.qrSvg, 62)}
  </div>
  <div style="height:${u(10)}; background:${hazard}"></div>
</div>`;
}

export const template31: PdfTemplateDefinition = {
  id: '31',
  name: 'Chantier',
  description: 'BTP et artisans : bandeau hachuré jaune et noir, capitales condensées, cases de visa.',
  accent: '#F5C400',
  paper: '#FFFFFF',
  render,
  vocabulary: 'craft',
  category: 'artisan',
  ownsLegalIds: true,
};
