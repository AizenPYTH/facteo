import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import {
  FONTS,
  addressLines,
  escapeHtml,
  legalBlock,
  logoBanner,
  lineTable,
  qrSlot,
  u,
} from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';

const INK = '#1F2328';
const MUTED = '#616A75';
const LABEL = '#8A94A0';
const BORDER = '#DDE2E8';

function metaCell(label: string, value: string): string {
  return `<div style="flex:1; min-width:0; background:#fff; padding:${u(9)} ${u(11)}">
    <div style="font-size:${u(9)}; letter-spacing:${u(
      1,
    )}; text-transform:uppercase; color:${LABEL}">${escapeHtml(label)}</div>
    <div style="font-size:${u(11.5)}; font-weight:600; margin-top:${u(3)}">${escapeHtml(value)}</div>
  </div>`;
}

/** Récapitulatif 4 colonnes propre à ce modèle : taux / base / TVA / TTC. */
function vatRecapFourColumns(
  rows: { rate: string; base: string; amount: string }[],
  totalsHt: string,
  totalsVat: string,
  totalsTtc: string,
): string {
  if (rows.length === 0) {
    return '';
  }

  const body = rows
    .map((row) => {
      const base = Number(row.base.replace(/[^\d,-]/g, '').replace(',', '.'));
      const amount = Number(row.amount.replace(/[^\d,-]/g, '').replace(',', '.'));
      const ttc = Number.isFinite(base) && Number.isFinite(amount)
        ? new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
          }).format(base + amount)
        : '';

      return `<div style="display:flex; border-top:1px solid #EEF1F4">
        <div style="width:${u(60)}; padding:${u(7)} ${u(10)}">${escapeHtml(row.rate)}</div>
        <div style="flex:1; padding:${u(7)} ${u(10)}; text-align:right">${escapeHtml(row.base)}</div>
        <div style="flex:1; padding:${u(7)} ${u(10)}; text-align:right">${escapeHtml(row.amount)}</div>
        <div style="flex:1; padding:${u(7)} ${u(10)}; text-align:right">${escapeHtml(ttc)}</div>
      </div>`;
    })
    .join('');

  return `<div style="border:1px solid ${BORDER}; font-size:${u(10.5)}">
    <div style="display:flex; background:#F4F6F8; color:${MUTED}; font-size:${u(
      9.5,
    )}; letter-spacing:${u(0.8)}; text-transform:uppercase">
      <div style="width:${u(60)}; padding:${u(7)} ${u(10)}">Taux</div>
      <div style="flex:1; padding:${u(7)} ${u(10)}; text-align:right">Base HT</div>
      <div style="flex:1; padding:${u(7)} ${u(10)}; text-align:right">TVA</div>
      <div style="flex:1; padding:${u(7)} ${u(10)}; text-align:right">Total TTC</div>
    </div>
    ${body}
    <div style="display:flex; border-top:1px solid ${BORDER}; font-weight:600; background:#F9FAFB">
      <div style="width:${u(60)}; padding:${u(7)} ${u(10)}">Total</div>
      <div style="flex:1; padding:${u(7)} ${u(10)}; text-align:right">${escapeHtml(totalsHt)}</div>
      <div style="flex:1; padding:${u(7)} ${u(10)}; text-align:right">${escapeHtml(totalsVat)}</div>
      <div style="flex:1; padding:${u(7)} ${u(10)}; text-align:right">${escapeHtml(totalsTtc)}</div>
    </div>
  </div>`;
}

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;

  return `<div class="dc-page" style="font-family:${FONTS.plexSans}; color:${INK}; background:#fff; padding:${u(
    42,
  )} ${u(46)} ${u(36)}; font-variant-numeric:tabular-nums">
  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:${u(20)}">
    <div style="min-width:0">
      ${logoBanner(context.logoUrl, { maxHeight: 30, marginBottom: 8 })}
      <div style="font-size:${u(15)}; font-weight:600">${escapeHtml(issuer.name)}</div>
      <div style="font-size:${u(10)}; line-height:1.7; color:${MUTED}; margin-top:${u(
        5,
      )}">${addressLines([
        [issuer.addressLines.join(', '), issuer.siret ? `SIRET ${issuer.siret}` : '']
          .filter(Boolean)
          .join(' · '),
        [issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '', issuer.email ?? '']
          .filter(Boolean)
          .join(' · '),
      ])}</div>
    </div>
    <div style="text-align:right; flex-shrink:0">
      <div style="display:inline-block; border:1px solid ${INK}; padding:${u(6)} ${u(
        14,
      )}; font-size:${u(12)}; font-weight:600; letter-spacing:${u(
        1.2,
      )}; text-transform:uppercase">${escapeHtml(labels.document)}</div>
      <div style="font-family:${FONTS.plexMono}; font-size:${u(11)}; color:${MUTED}; margin-top:${u(
        7,
      )}">${escapeHtml(context.number)}</div>
    </div>
  </div>

  ${
    context.meta.length > 0
      ? `<div style="display:flex; gap:1px; background:${BORDER}; border:1px solid ${BORDER}; margin-top:${u(
          22,
        )}">${context.meta.map((entry) => metaCell(entry.label, entry.value)).join('')}</div>`
      : ''
  }

  <div style="display:flex; justify-content:space-between; gap:${u(20)}; margin-top:${u(
    20,
  )}; font-size:${u(11)}; line-height:1.7">
    <div style="min-width:0">
      <span style="font-size:${u(9)}; letter-spacing:${u(
        1,
      )}; text-transform:uppercase; color:${LABEL}">Client facturé</span><br/>
      <strong>${escapeHtml(client.name)}</strong>${
        client.contactName ? ` — ${escapeHtml(client.contactName)}` : ''
      }<br/>${addressLines([
        client.addressLines.join(', '),
        client.vatNumber ? `TVA ${client.vatNumber}` : '',
      ])}
    </div>
    <div style="text-align:right; flex-shrink:0">
      <span style="font-size:${u(9)}; letter-spacing:${u(
        1,
      )}; text-transform:uppercase; color:${LABEL}">${escapeHtml(
        context.kind === 'quote' ? 'Total du devis' : 'Solde dû',
      )}</span><br/>
      <span style="font-size:${u(20)}; font-weight:600">${escapeHtml(totals.amountDue)}</span>
    </div>
  </div>

  <div style="margin-top:${u(20)}; border-top:1px solid ${INK}">
    ${lineTable(context, {
      columns: ['index', 'unit', 'vat'],
      headBorder: `1px solid ${BORDER}`,
      headColor: LABEL,
      headSize: 9,
      headTracking: 0.9,
      rowBorder: '1px solid #EEF1F4',
      fontSize: 11,
      descriptionColor: '#7C8794',
      valueColor: INK,
      rowPadding: 8,
    })}
  </div>

  <div class="dc-keep" style="display:flex; gap:${u(18)}; margin-top:${u(20)}; align-items:flex-start">
    <div style="flex:1; min-width:0">
      ${vatRecapFourColumns(totals.vat, totals.totalHt, totals.totalVat, totals.totalTtc)}
    </div>
    <div style="width:${u(250)}; font-size:${u(11)}; flex-shrink:0">
      ${[
        ...totals.rows.filter((row) => !row.label.startsWith('TVA')),
        { label: 'Total TTC', value: totals.totalTtc },
        ...(totals.deposit ? [{ label: 'Acompte', value: totals.deposit }] : []),
      ]
        .map(
          (row, index, all) =>
            `<div style="display:flex; justify-content:space-between; padding:${u(5)} 0; ${
              index === all.length - 1 ? `border-bottom:1px solid ${BORDER};` : ''
            }"><span style="color:${MUTED}">${escapeHtml(row.label)}</span><span>${escapeHtml(
              row.value,
            )}</span></div>`,
        )
        .join('')}
      <div style="display:flex; justify-content:space-between; padding:${u(9)} 0; font-size:${u(
        14,
      )}; font-weight:600"><span>${escapeHtml(labels.amountDue)}</span><span>${escapeHtml(
        totals.amountDue,
      )}</span></div>
      ${
        context.qrSvg || context.payment.iban
          ? `<div style="display:flex; gap:${u(12)}; align-items:center; margin-top:${u(6)}">
               ${qrSlot(context.qrSvg, 52)}
               <div style="font-size:${u(9.5)}; line-height:1.6; color:${MUTED}">${addressLines([
                 context.payment.iban ? `IBAN ${context.payment.iban}` : '',
                 context.payment.bic ? `BIC ${context.payment.bic}` : '',
               ])}</div>
             </div>`
          : ''
      }
    </div>
  </div>

  <div class="dc-spacer"></div>

  ${
    context.legalMentions.length > 0 || context.notes
      ? `<div class="dc-keep" style="border-top:1px solid #EEF1F4; padding-top:${u(12)}">${legalBlock(
          [context.notes ?? '', ...context.legalMentions].filter(Boolean),
          { color: LABEL, size: 9 },
        )}</div>`
      : ''
  }
</div>`;
}

export const template16: PdfTemplateDefinition = {
  id: '16',
  name: 'Clean Accounting',
  description: 'Pensé pour l’expert-comptable : dense, chiffres tabulaires, récapitulatif de TVA à 4 colonnes.',
  accent: INK,
  paper: '#FFFFFF',
  render,
};
