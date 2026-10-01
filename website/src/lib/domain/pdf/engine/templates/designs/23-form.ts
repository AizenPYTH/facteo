import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const LINE = '#2B2B2B';
const TINT = '#F2F2EE';
const BOX = `${u(1)} solid ${LINE}`;

/** Case de formulaire : petit libellé numéroté en coin, valeur dessous. */
function field(index: number, label: string, value: string, flex = 1): string {
  return `<div style="flex:${flex}; border:${BOX}; margin:-${u(0.5)}; padding:${u(5)} ${u(8)} ${u(7)}; min-height:${u(44)}">
    <div style="font-size:${u(8)}; text-transform:uppercase; letter-spacing:${u(0.6)}; color:#555"><span style="display:inline-block; min-width:${u(14)}; font-weight:700">${index}</span>${escapeHtml(label)}</div>
    <div style="font-size:${u(11)}; line-height:1.5; margin-top:${u(3)}">${value || '&nbsp;'}</div>
  </div>`;
}

/** Formulaire administratif : cases numérotées, tableau entièrement quadrillé. */
function render(context: TemplateContext): string {
  const { issuer, client, labels } = context;
  let n = 0;
  const next = () => ++n;

  return `<div class="dc-page" style="font-family:${FONTS.plexSans}; color:${LINE}; background:#fff; padding:${u(40)} ${u(44)}">
  <div style="display:flex; justify-content:space-between; align-items:center; background:${LINE}; color:#fff; padding:${u(10)} ${u(14)}">
    <div style="font-size:${u(18)}; font-weight:700; letter-spacing:${u(3)}; text-transform:uppercase">${escapeHtml(labels.document)}</div>
    <div style="font-family:${FONTS.plexMono}; font-size:${u(12)}">${escapeHtml(labels.number)} ${escapeHtml(context.number)}</div>
  </div>

  <div style="display:flex; margin-top:${u(14)}">
    ${field(next(), labels.issuer, `<b>${escapeHtml(issuer.name)}</b><br/>${joinLines([...issuer.addressLines, issuer.phone])}`, 1.2)}
    ${field(next(), labels.billedTo, `<b>${escapeHtml(client.name)}</b><br/>${joinLines([client.contactName ?? '', ...client.addressLines, client.vatNumber ? `TVA ${client.vatNumber}` : ''])}`, 1.2)}
  </div>
  <div style="display:flex">
    ${context.issuerLegalIds.map((entry) => field(next(), entry.label, escapeHtml(entry.value))).join('')}
    ${context.meta.map((entry) => field(next(), entry.label, escapeHtml(entry.value))).join('')}
  </div>

  <table style="width:100%; border-collapse:collapse; margin-top:${u(18)}; font-size:${u(10.5)}">
    <thead><tr style="background:${TINT}">
      ${[labels.designation, labels.quantity, labels.unitPrice, labels.vat, labels.totalHt]
        .map(
          (label, index) =>
            `<th style="border:${BOX}; padding:${u(6)} ${u(7)}; font-size:${u(8.5)}; text-transform:uppercase; letter-spacing:${u(0.5)}; text-align:${index === 0 ? 'left' : 'right'}">${escapeHtml(label)}</th>`,
        )
        .join('')}
    </tr></thead>
    <tbody>${context.lines
      .map(
        (line) => `<tr>
        <td style="border:${BOX}; padding:${u(6)} ${u(7)}">${escapeHtml(line.title)}${line.description ? `<div style="font-size:${u(9)}; color:#666">${escapeHtml(line.description)}</div>` : ''}</td>
        <td style="border:${BOX}; padding:${u(6)} ${u(7)}; text-align:right; width:${u(70)}">${quantityText(line)}</td>
        <td style="border:${BOX}; padding:${u(6)} ${u(7)}; text-align:right; width:${u(90)}">${escapeHtml(line.unitPrice)}</td>
        <td style="border:${BOX}; padding:${u(6)} ${u(7)}; text-align:right; width:${u(56)}">${escapeHtml(line.vatRate)}</td>
        <td style="border:${BOX}; padding:${u(6)} ${u(7)}; text-align:right; width:${u(96)}; font-family:${FONTS.plexMono}">${escapeHtml(line.totalHt)}</td>
      </tr>`,
      )
      .join('')}</tbody>
  </table>

  <div class="dc-keep" style="display:flex; gap:${u(16)}; margin-top:${u(16)}; align-items:flex-start">
    <div style="flex:1; display:flex; flex-direction:column">
      ${field(next(), labels.payment, `${joinLines([context.payment.terms, ...paymentLines(context)])}`)}
      ${context.notes ? field(next(), 'Observations', escapeHtml(context.notes)) : ''}
    </div>
    <table style="width:${u(290)}; border-collapse:collapse; font-size:${u(11)}">
      ${totalsList(context)
        .map(
          (entry) => `<tr style="${entry.kind === 'final' ? `background:${LINE}; color:#fff; font-weight:700; font-size:${u(13)};` : ''}">
            <td style="border:${BOX}; padding:${u(6)} ${u(8)}">${escapeHtml(entry.label)}</td>
            <td style="border:${BOX}; padding:${u(6)} ${u(8)}; text-align:right; font-family:${FONTS.plexMono}">${escapeHtml(entry.value)}</td>
          </tr>`,
        )
        .join('')}
    </table>
  </div>

  <div class="dc-spacer"></div>
  <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:${u(20)}; font-size:${u(8.5)}; color:#555; line-height:1.6">
    <div>${joinLines(context.legalMentions)}</div>
    ${qrSlot(context.qrSvg, 64)}
  </div>
</div>`;
}

export const template23: PdfTemplateDefinition = {
  id: '23',
  name: 'Formulaire',
  description: 'Imprimé administratif : cases numérotées, tableau quadrillé, bandeau noir.',
  accent: '#2B2B2B',
  paper: '#FFFFFF',
  render,
  vocabulary: 'ledger',
  category: 'classique',
  ownsLegalIds: true,
};
