import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, legalIdsText, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const BLUE = '#16407A';
const WHITE = '#F4F8FF';
const FAINT = 'rgba(244,248,255,.62)';
const RULE = 'rgba(244,248,255,.8)';

/** Plan d'architecte : fond bleu quadrillé, traits blancs fins, cotes et cartouche en bas à droite. */
function render(context: TemplateContext): string {
  const { issuer, client, labels, totals } = context;
  const legal = legalIdsText(context);
  const grid = [
    `linear-gradient(rgba(255,255,255,.07) ${u(1)}, transparent ${u(1)})`,
    `linear-gradient(90deg, rgba(255,255,255,.07) ${u(1)}, transparent ${u(1)})`,
    `linear-gradient(rgba(255,255,255,.16) ${u(1)}, transparent ${u(1)})`,
    `linear-gradient(90deg, rgba(255,255,255,.16) ${u(1)}, transparent ${u(1)})`,
  ].join(', ');
  const gridSize = `${u(20)} ${u(20)}, ${u(20)} ${u(20)}, ${u(100)} ${u(100)}, ${u(100)} ${u(100)}`;
  const condensed = (text: string, size: number, extra = '') =>
    `<span style="font-family:${FONTS.oswald}; font-size:${u(size)}; text-transform:uppercase; letter-spacing:${u(1.5)}; ${extra}">${text}</span>`;
  const marker = (letter: string) =>
    `<span style="display:inline-flex; width:${u(20)}; height:${u(20)}; border:${u(1)} solid ${WHITE}; border-radius:50%; align-items:center; justify-content:center; font-family:${FONTS.oswald}; font-size:${u(10)}; margin-right:${u(8)}">${letter}</span>`;
  const cell = (caption: string, value: string, attrs = '') =>
    `<td ${attrs} style="border:${u(1)} solid ${RULE}; padding:${u(4)} ${u(7)}; vertical-align:top"><div style="font-size:${u(7)}; text-transform:uppercase; letter-spacing:${u(1)}; color:${FAINT}">${caption}</div><div style="font-size:${u(10)}; margin-top:${u(1)}">${value}</div></td>`;
  const payment = paymentLines(context);
  const dates = [
    context.issuedAt ? { label: labels.issuedAt, value: context.issuedAt } : null,
    context.secondaryDate ? { label: labels.secondaryDate, value: context.secondaryDate } : null,
  ].filter((entry): entry is { label: string; value: string } => entry !== null);
  const tick = `<span style="width:${u(1)}; height:${u(14)}; background:${WHITE}"></span>`;

  return `<div class="dc-page" style="font-family:${FONTS.plexMono}; color:${WHITE}; background-color:${BLUE}; background-image:${grid}; background-size:${gridSize}; box-shadow:inset 0 0 0 ${u(22)} ${BLUE}, inset 0 0 0 ${u(23)} ${RULE}, inset 0 0 0 ${u(27)} ${BLUE}, inset 0 0 0 ${u(28)} ${FAINT}; padding:${u(48)} ${u(50)} ${u(44)}">
  <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:${u(1)} solid ${RULE}; padding-bottom:${u(10)}">
    <div>
      ${condensed('Feuille 01 — Relevé des ouvrages', 9, `color:${FAINT}`)}
      <div>${condensed(escapeHtml(labels.documentUpper), 40, 'font-weight:600; letter-spacing:' + u(4))}</div>
    </div>
    <div style="text-align:right; font-size:${u(10)}; line-height:1.6">
      ${condensed(`${escapeHtml(labels.number)} ${escapeHtml(context.number)}`, 16, 'font-weight:500')}
      ${context.meta.map((entry) => `<div>${escapeHtml(entry.label)} <span style="color:${FAINT}">·</span> ${entry.strong ? `<b>${escapeHtml(entry.value)}</b>` : escapeHtml(entry.value)}</div>`).join('')}
    </div>
  </div>

  <div style="display:flex; gap:${u(20)}; margin-top:${u(20)}; font-size:${u(10)}; line-height:1.6">
    <div style="flex:1; border:${u(1)} dashed ${FAINT}; padding:${u(10)} ${u(12)}">
      <div style="display:flex; align-items:center; margin-bottom:${u(6)}">${marker('A')}${condensed(escapeHtml(labels.issuer), 10, `color:${FAINT}`)}</div>
      <div style="font-weight:600; font-size:${u(12)}">${escapeHtml(issuer.name)}</div>
      <div>${joinLines([...issuer.addressLines, issuer.phone, issuer.email])}</div>
      ${legal ? `<div style="color:${FAINT}; font-size:${u(9)}; margin-top:${u(3)}">${escapeHtml(legal)}</div>` : ''}
    </div>
    <div style="flex:1; border:${u(1)} dashed ${FAINT}; padding:${u(10)} ${u(12)}">
      <div style="display:flex; align-items:center; margin-bottom:${u(6)}">${marker('B')}${condensed(escapeHtml(labels.billedTo), 10, `color:${FAINT}`)}</div>
      <div style="font-weight:600; font-size:${u(12)}">${escapeHtml(client.name)}</div>
      <div>${joinLines([client.contactName, ...client.addressLines, client.vatNumber ? `TVA ${client.vatNumber}` : ''])}</div>
    </div>
  </div>

  <div style="display:flex; align-items:center; gap:${u(6)}; margin-top:${u(22)}">
    ${tick}<span style="flex:1; height:${u(1)}; background:${WHITE}"></span>
    ${condensed(`${escapeHtml(labels.amountDue)} = ${escapeHtml(totals.amountDue)}`, 11, `padding:0 ${u(6)}`)}
    <span style="flex:1; height:${u(1)}; background:${WHITE}"></span>${tick}
  </div>

  <table style="width:100%; border-collapse:collapse; margin-top:${u(14)}; font-size:${u(10)}">
    <thead><tr>
      <th style="border:${u(1)} solid ${RULE}; padding:${u(6)}; width:${u(46)}; text-align:center">${condensed('Rep.', 9)}</th>
      <th style="border:${u(1)} solid ${RULE}; padding:${u(6)}; text-align:left">${condensed(escapeHtml(labels.designation), 9)}</th>
      <th style="border:${u(1)} solid ${RULE}; padding:${u(6)}; width:${u(72)}; text-align:right">${condensed(escapeHtml(labels.quantity), 9)}</th>
      <th style="border:${u(1)} solid ${RULE}; padding:${u(6)}; width:${u(96)}; text-align:right">${condensed(escapeHtml(labels.unitPrice), 9)}</th>
      <th style="border:${u(1)} solid ${RULE}; padding:${u(6)}; width:${u(54)}; text-align:right">${condensed(escapeHtml(labels.vat), 9)}</th>
      <th style="border:${u(1)} solid ${RULE}; padding:${u(6)}; width:${u(104)}; text-align:right">${condensed(escapeHtml(labels.totalHt), 9)}</th>
    </tr></thead>
    <tbody>${context.lines
      .map(
        (line) => `<tr>
        <td style="border:${u(1)} solid ${RULE}; padding:${u(7)} ${u(6)}; text-align:center; color:${FAINT}">${String(line.index).padStart(2, '0')}</td>
        <td style="border:${u(1)} solid ${RULE}; padding:${u(7)} ${u(8)}"><span style="font-weight:600">${escapeHtml(line.title)}</span>${line.description ? `<div style="color:${FAINT}; font-size:${u(9)}">${escapeHtml(line.description)}</div>` : ''}</td>
        <td style="border:${u(1)} solid ${RULE}; padding:${u(7)} ${u(6)}; text-align:right">${quantityText(line)}</td>
        <td style="border:${u(1)} solid ${RULE}; padding:${u(7)} ${u(6)}; text-align:right">${escapeHtml(line.unitPrice)}</td>
        <td style="border:${u(1)} solid ${RULE}; padding:${u(7)} ${u(6)}; text-align:right; color:${FAINT}">${escapeHtml(line.vatRate)}</td>
        <td style="border:${u(1)} solid ${RULE}; padding:${u(7)} ${u(6)}; text-align:right; font-weight:600">${escapeHtml(line.totalHt)}</td>
      </tr>`,
      )
      .join('')}</tbody>
  </table>

  <div class="dc-keep" style="display:flex; gap:${u(20)}; margin-top:${u(18)}; align-items:flex-start">
    <div style="flex:1; font-size:${u(9.5)}; line-height:1.65">
      ${
        context.payment.terms || payment.length > 0
          ? `<div style="display:flex; align-items:center; margin-bottom:${u(4)}">${marker('C')}${condensed(escapeHtml(labels.payment), 10, `color:${FAINT}`)}</div><div>${joinLines([context.payment.terms, ...payment])}</div>`
          : ''
      }
      ${context.notes ? `<div style="margin-top:${u(10)}; border-left:${u(1)} solid ${WHITE}; padding-left:${u(10)}; color:${FAINT}">NOTA — ${escapeHtml(context.notes)}</div>` : ''}
    </div>
    <div style="width:${u(300)}; font-size:${u(10)}">
      ${totalsList(context)
        .filter((entry) => entry.kind !== 'final')
        .map(
          (entry) =>
            `<div style="display:flex; justify-content:space-between; padding:${u(4)} 0; border-bottom:${u(1)} dotted ${FAINT}; ${entry.kind === 'ttc' ? 'font-weight:600;' : ''}"><span>${escapeHtml(entry.label)}</span><span>${escapeHtml(entry.value)}</span></div>`,
        )
        .join('')}
      <div style="display:flex; justify-content:space-between; align-items:center; border:${u(1.5)} solid ${WHITE}; padding:${u(8)} ${u(10)}; margin-top:${u(8)}; background:rgba(255,255,255,.06)">
        ${condensed(escapeHtml(labels.amountDue), 12)}${condensed(escapeHtml(totals.amountDue), 20, 'font-weight:600')}
      </div>
    </div>
  </div>

  <div class="dc-spacer"></div>
  <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:${u(18)}">
    <div style="flex:1; display:flex; align-items:flex-end; gap:${u(14)}">
      ${context.qrSvg ? `<div style="background:${WHITE}; padding:${u(4)}">${qrSlot(context.qrSvg, 60)}</div>` : ''}
      ${context.legalMentions.length > 0 ? `<div style="font-size:${u(8)}; line-height:1.55; color:${FAINT}">${joinLines(context.legalMentions)}</div>` : ''}
    </div>
    <table style="width:${u(330)}; border-collapse:collapse; border:${u(1.5)} solid ${WHITE}">
      <tr>
        <td colspan="2" style="border:${u(1)} solid ${RULE}; padding:${u(6)} ${u(8)}">
          ${context.logoUrl ? `<div style="display:inline-block; background:${WHITE}; padding:${u(3)} ${u(6)}; margin-bottom:${u(4)}"><img src="${escapeHtml(context.logoUrl)}" alt="" style="display:block; max-height:${u(28)}; max-width:${u(150)}" /></div>` : ''}
          ${condensed(escapeHtml(issuer.name), 13, 'font-weight:600; display:block')}
        </td>
      </tr>
      <tr>
        ${cell('Pièce', escapeHtml(labels.documentUpper))}
        ${cell(escapeHtml(labels.number), `<b>${escapeHtml(context.number)}</b>`)}
      </tr>
      ${dates.length > 0 ? `<tr>${dates.map((entry) => cell(escapeHtml(entry.label), escapeHtml(entry.value), dates.length === 1 ? 'colspan="2"' : '')).join('')}</tr>` : ''}
      <tr>
        ${cell('Échelle', '1 : 1')}
        ${cell('Folio', '01 / 01')}
      </tr>
    </table>
  </div>
</div>`;
}

export const template34: PdfTemplateDefinition = {
  id: '34',
  name: 'Plan',
  description: "Plan d'architecte : fond bleu quadrillé, traits blancs, cotes et cartouche technique.",
  accent: '#16407A',
  paper: '#16407A',
  render,
  vocabulary: 'craft',
  category: 'artisan',
  ownsLegalIds: true,
};
