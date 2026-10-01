import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, legalIdsText, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const PAPER = '#FFF3C4';
const RED = '#C8372D';
const BLUE_RULE = '#7FA6D6';
const PEN = '#1F3F9E';
const PRINT = '#6A4A3A';

/**
 * Carbone : bordereau autocopiant. Formulaire pré-imprimé (filets rouges et
 * bleus, libellés en petites capitales condensées), valeurs « remplies à la
 * main » à l'encre bleue.
 */
function render(context: TemplateContext): string {
  const { issuer, client, labels, totals } = context;
  const legal = legalIdsText(context);
  const payment = [context.payment.terms, ...paymentLines(context)];
  const hasPayment = payment.some(Boolean);

  const printed = (text: string, size = 8.5) =>
    `<span style="font-family:${FONTS.oswald}; font-size:${u(size)}; font-weight:500; letter-spacing:${u(1.1)}; text-transform:uppercase; color:${RED}">${text}</span>`;
  const hand = (text: string, size = 17) =>
    `<span style="font-family:${FONTS.caveat}; font-size:${u(size)}; color:${PEN}; line-height:1.15">${text}</span>`;
  const box = (title: string, content: string, extra = '') =>
    `<div style="border:${u(1.5)} solid ${RED}; ${extra}"><div style="background:${RED}; color:${PAPER}; padding:${u(2)} ${u(8)}; font-family:${FONTS.oswald}; font-size:${u(9)}; letter-spacing:${u(1.4)}; text-transform:uppercase">${title}</div><div style="padding:${u(6)} ${u(10)} ${u(8)}">${content}</div></div>`;
  /** Ligne de formulaire : libellé imprimé, valeur manuscrite sur filet bleu. */
  const field = (label: string, value: string) =>
    `<div style="display:flex; align-items:baseline; gap:${u(8)}; border-bottom:${u(1)} solid ${BLUE_RULE}; padding:${u(2)} 0">${printed(label)}<span style="flex:1; min-width:0">${hand(value, 16)}</span></div>`;
  const checkbox = (checked: boolean, label: string) =>
    `<span style="display:inline-flex; align-items:center; gap:${u(5)}; margin-right:${u(14)}"><span style="width:${u(11)}; height:${u(11)}; border:${u(1.2)} solid ${RED}; display:inline-flex; align-items:center; justify-content:center; font-family:${FONTS.caveat}; font-size:${u(15)}; color:${PEN}; line-height:1">${checked ? '✓' : ''}</span>${printed(label, 8.5)}</span>`;

  const blankCell = `border-right:${u(1)} solid ${RED}; border-bottom:${u(1)} solid ${BLUE_RULE}`;
  const cols: [string, string, number][] = [
    [labels.designation, 'left', 0],
    [labels.quantity, 'right', 66],
    [labels.unitPrice, 'right', 86],
    [labels.vat, 'right', 50],
    [labels.totalHt, 'right', 98],
  ];

  return `<div class="dc-page" style="font-family:${FONTS.workSans}; color:${PRINT}; background:${PAPER}; padding:${u(34)} ${u(40)} ${u(26)}">
  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:${u(20)}; border-bottom:${u(3)} double ${RED}; padding-bottom:${u(12)}">
    <div style="min-width:0">
      ${context.logoUrl ? `<img src="${escapeHtml(context.logoUrl)}" alt="" style="display:block; max-height:${u(42)}; max-width:${u(170)}; margin-bottom:${u(6)}; mix-blend-mode:multiply" />` : ''}
      <div style="font-family:${FONTS.oswald}; font-size:${u(20)}; font-weight:700; text-transform:uppercase; letter-spacing:${u(0.6)}; color:${RED}">${escapeHtml(issuer.name)}</div>
      <div style="font-size:${u(9.5)}; line-height:1.55">${joinLines([...issuer.addressLines, issuer.phone, issuer.email])}</div>
      ${legal ? `<div style="font-size:${u(8.5)}; margin-top:${u(2)}">${escapeHtml(legal)}</div>` : ''}
    </div>
    <div style="text-align:right; flex-shrink:0">
      <div style="font-family:${FONTS.oswald}; font-size:${u(30)}; font-weight:700; text-transform:uppercase; letter-spacing:${u(2)}; color:${RED}; line-height:1">${escapeHtml(labels.document)}</div>
      <div style="display:inline-flex; align-items:baseline; gap:${u(8)}; border:${u(1.5)} solid ${RED}; padding:${u(2)} ${u(10)}; margin-top:${u(8)}">${printed(escapeHtml(labels.number), 10)}${hand(escapeHtml(context.number), 22)}</div>
      <div style="margin-top:${u(8)}">${checkbox(false, 'Original')}${checkbox(true, 'Copie client')}${checkbox(false, 'Archive')}</div>
    </div>
  </div>

  <div style="display:flex; gap:${u(14)}; margin-top:${u(14)}">
    ${box(
      escapeHtml(labels.billedTo),
      `${field('Nom', escapeHtml(client.name))}
      ${client.contactName ? field('Contact', escapeHtml(client.contactName)) : ''}
      ${field('Adresse', joinLines(client.addressLines, ', ') || '&nbsp;')}
      ${client.vatNumber ? field('TVA', escapeHtml(client.vatNumber)) : ''}`,
      'flex:1.4; min-width:0',
    )}
    ${box(
      'Références',
      context.meta.map((entry) => field(escapeHtml(entry.label), escapeHtml(entry.value))).join('') || '&nbsp;',
      'flex:1; min-width:0',
    )}
  </div>

  <table style="width:100%; border-collapse:collapse; table-layout:fixed; margin-top:${u(14)}; border:${u(1.5)} solid ${RED}">
    <thead><tr>
      ${cols
        .map(
          ([label, align, width]) =>
            `<th style="${width ? `width:${u(width)};` : ''} text-align:${align}; padding:${u(4)} ${u(8)}; border:${u(1)} solid ${RED}; font-family:${FONTS.oswald}; font-size:${u(9)}; font-weight:500; letter-spacing:${u(1.2)}; text-transform:uppercase; color:${RED}; background:rgba(200,55,45,0.07)">${escapeHtml(label)}</th>`,
        )
        .join('')}
    </tr></thead>
    <tbody>${context.lines
      .map(
        (line) => `<tr>
        <td style="padding:${u(4)} ${u(8)}; border-left:${u(1)} solid ${RED}; border-right:${u(1)} solid ${RED}; border-bottom:${u(1)} solid ${BLUE_RULE}; vertical-align:top">${hand(escapeHtml(line.title), 17)}${line.description ? `<div>${hand(escapeHtml(line.description), 14)}</div>` : ''}</td>
        <td style="padding:${u(4)} ${u(8)}; border-right:${u(1)} solid ${RED}; border-bottom:${u(1)} solid ${BLUE_RULE}; text-align:right; vertical-align:top">${hand(quantityText(line), 17)}</td>
        <td style="padding:${u(4)} ${u(8)}; border-right:${u(1)} solid ${RED}; border-bottom:${u(1)} solid ${BLUE_RULE}; text-align:right; vertical-align:top">${hand(escapeHtml(line.unitPrice), 17)}</td>
        <td style="padding:${u(4)} ${u(8)}; border-right:${u(1)} solid ${RED}; border-bottom:${u(1)} solid ${BLUE_RULE}; text-align:right; vertical-align:top">${hand(escapeHtml(line.vatRate), 17)}</td>
        <td style="padding:${u(4)} ${u(8)}; border-bottom:${u(1)} solid ${BLUE_RULE}; text-align:right; vertical-align:top">${hand(escapeHtml(line.totalHt), 18)}</td>
      </tr>`,
      )
      .join('')}
      ${Array.from({ length: Math.max(0, 4 - context.lines.length) })
        .map(
          () =>
            `<tr><td style="height:${u(24)}; border-left:${u(1)} solid ${RED}; ${blankCell}"></td>${`<td style="${blankCell}"></td>`.repeat(3)}<td style="border-bottom:${u(1)} solid ${BLUE_RULE}"></td></tr>`,
        )
        .join('')}
    </tbody>
  </table>

  <div class="dc-keep" style="display:flex; gap:${u(14)}; margin-top:${u(14)}; align-items:stretch">
    <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:${u(14)}">
      ${box(
        escapeHtml(labels.payment),
        `<div style="display:flex; gap:${u(12)}; align-items:flex-start"><div style="flex:1; min-width:0; line-height:1.25">${hasPayment ? hand(joinLines(payment), 15) : '&nbsp;'}</div>${qrSlot(context.qrSvg, 60)}</div>`,
      )}
      ${context.notes ? box('Observations', hand(escapeHtml(context.notes), 15)) : ''}
      <div style="display:flex; gap:${u(14)}">
        <div style="flex:1; border:${u(1)} dashed ${RED}; height:${u(58)}; padding:${u(4)} ${u(8)}">${printed('Signature émetteur')}</div>
        <div style="flex:1; border:${u(1)} dashed ${RED}; height:${u(58)}; padding:${u(4)} ${u(8)}">${printed('Reçu par le client')}</div>
      </div>
    </div>
    <div style="width:${u(290)}; border:${u(1.5)} solid ${RED}">
      ${totalsList(context)
        .filter((entry) => entry.kind !== 'final')
        .map(
          (entry) => `<div style="display:flex; justify-content:space-between; align-items:baseline; gap:${u(10)}; padding:${u(3)} ${u(10)}; border-bottom:${u(1)} solid ${BLUE_RULE}">${printed(escapeHtml(entry.label))}${hand(escapeHtml(entry.value), entry.kind === 'ttc' ? 19 : 16)}</div>`,
        )
        .join('')}
      <div style="background:rgba(200,55,45,0.1); border-top:${u(2)} solid ${RED}; padding:${u(8)} ${u(10)}">
        <div>${printed(escapeHtml(labels.amountDue), 10)}</div>
        <div style="text-align:right">${hand(`<span style="display:inline-block; border-bottom:${u(2)} solid ${PEN}; padding:0 ${u(6)}">${escapeHtml(totals.amountDue)}</span>`, 30)}</div>
      </div>
    </div>
  </div>

  <div class="dc-spacer"></div>
  <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:${u(20)}; border-top:${u(1)} solid ${RED}; padding-top:${u(6)}; font-size:${u(8)}; line-height:1.5">
    <div>${joinLines(context.legalMentions)}</div>
    <div style="font-family:${FONTS.oswald}; letter-spacing:${u(1.5)}; text-transform:uppercase; color:${RED}; white-space:nowrap">Feuillet 2 / 3 — jaune</div>
  </div>
</div>`;
}

export const template41: PdfTemplateDefinition = {
  id: '41',
  name: 'Carbone',
  description: 'Bordereau autocopiant : papier jaune, filets rouges et bleus, valeurs manuscrites à l’encre bleue.',
  accent: RED,
  paper: PAPER,
  render,
  vocabulary: 'ledger',
  category: 'artisan',
  ownsLegalIds: true,
};
