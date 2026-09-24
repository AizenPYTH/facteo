import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import {
  FONTS,
  addressLines,
  escapeHtml,
  escapeMultiline,
  legalBlock,
  logoBanner,
  qrSlot,
  u,
  LINES_ANCHOR,
} from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';

const INK = '#141821';
const MUTED = '#6C7482';
const LABEL = '#9AA2AF';
const BAND = '#F2F4F7';
const GUTTER = 44;

/** Bandes pleine largeur : aucune marge latérale, chaque bloc occupe toute la page. */
function darkCell(label: string, value: string): string {
  return `<div style="flex:1; min-width:0">
    <div style="font-size:${u(9.5)}; letter-spacing:${u(
      1.4,
    )}; text-transform:uppercase; color:rgba(255,255,255,.55)">${escapeHtml(label)}</div>
    <div style="font-size:${u(13)}; font-weight:700; margin-top:${u(4)}">${escapeHtml(value)}</div>
  </div>`;
}

function summaryCell(label: string, value: string): string {
  return `<div style="flex:1; min-width:0">
    <div style="color:${MUTED}">${escapeHtml(label)}</div>
    <div style="font-weight:700; margin-top:${u(3)}">${escapeHtml(value)}</div>
  </div>`;
}

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;

  return `<div class="dc-page" style="font-family:${FONTS.jakarta}; color:${INK}; background:#fff">
  <div style="padding:${u(40)} ${u(GUTTER)} ${u(
    26,
  )}; display:flex; justify-content:space-between; align-items:flex-end; gap:${u(20)}">
    <div style="min-width:0">
    ${logoBanner(context.logoUrl, { maxHeight: 34, marginBottom: 12 })}
    <div style="font-size:${u(42)}; font-weight:800; letter-spacing:${u(
      -1.8,
    )}; line-height:1">${escapeHtml(labels.document)}<br/><span style="font-size:${u(
      16,
    )}; font-weight:600; letter-spacing:0; color:${MUTED}">${escapeHtml(
      `${context.number} · ${issuer.name}`,
    )}</span></div>
    </div>
    ${qrSlot(context.qrSvg, 66)}
  </div>

  <div style="background:${INK}; color:#fff; padding:${u(22)} ${u(GUTTER)}; display:flex; gap:${u(
    20,
  )}">
    ${context.meta.map((entry) => darkCell(entry.label, entry.value)).join('')}
    ${darkCell(labels.amountDue, totals.amountDue)}
  </div>

  <div style="padding:${u(24)} ${u(GUTTER)}; display:flex; gap:${u(
    28,
  )}; border-bottom:1px solid #E7EAEF">
    <div style="flex:1; min-width:0">
      <div style="font-size:${u(9.5)}; letter-spacing:${u(
        1.4,
      )}; text-transform:uppercase; color:${LABEL}">${escapeHtml(labels.issuer)}</div>
      <div style="font-size:${u(11.5)}; line-height:1.7; margin-top:${u(6)}">${addressLines([
        [issuer.name, issuer.addressLines.join(', ')].filter(Boolean).join(' — '),
        [
          issuer.siret ? `SIRET ${issuer.siret}` : '',
          issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '',
          issuer.phone ?? '',
        ]
          .filter(Boolean)
          .join(' · '),
      ])}</div>
    </div>
    <div style="flex:1; min-width:0">
      <div style="font-size:${u(9.5)}; letter-spacing:${u(
        1.4,
      )}; text-transform:uppercase; color:${LABEL}">Client</div>
      <div style="font-size:${u(11.5)}; line-height:1.7; margin-top:${u(
        6,
      )}"><strong>${escapeHtml(client.name)}</strong>${
        client.contactName ? ` — ${escapeHtml(client.contactName)}` : ''
      }<br/>${addressLines([
        [client.addressLines.join(', '), client.vatNumber ? `TVA ${client.vatNumber}` : '']
          .filter(Boolean)
          .join(' · '),
      ])}</div>
    </div>
  </div>

  <div style="padding:0 ${u(GUTTER)}">${LINES_ANCHOR}</div>
  <div>
    <div style="display:flex; gap:${u(10)}; padding:${u(12)} ${u(
      GUTTER,
    )}; background:${BAND}; font-size:${u(9.5)}; letter-spacing:${u(
      1.2,
    )}; text-transform:uppercase; color:${MUTED}">
      <div style="flex:1">${escapeHtml(labels.designation)}</div>
      <div style="width:${u(52)}; text-align:right">${escapeHtml(labels.quantity)}</div>
      <div style="width:${u(72)}; text-align:right">${escapeHtml(labels.unitPrice)}</div>
      <div style="width:${u(40)}; text-align:right">${escapeHtml(labels.vat)}</div>
      <div style="width:${u(88)}; text-align:right">${escapeHtml(labels.totalHt)}</div>
    </div>
    ${context.lines
      .map(
        (line) => `<div style="display:flex; gap:${u(10)}; padding:${u(11)} ${u(
          GUTTER,
        )}; border-bottom:1px solid #EEF0F4; font-size:${u(
          11.5,
        )}; align-items:baseline; font-variant-numeric:tabular-nums">
          <div style="flex:1; min-width:0"><span style="font-weight:700">${escapeHtml(
            line.title,
          )}</span>${
            line.description
              ? `<span style="color:#8A93A1; font-size:${u(10.5)}"> — ${escapeMultiline(
                  line.description,
                )}</span>`
              : ''
          }</div>
          <div style="width:${u(52)}; text-align:right; color:#5B6472">${escapeHtml(
            line.quantity,
          )}</div>
          <div style="width:${u(72)}; text-align:right; color:#5B6472">${escapeHtml(
            line.unitPrice,
          )}</div>
          <div style="width:${u(40)}; text-align:right; color:#8A93A1">${escapeHtml(
            line.vatRate,
          )}</div>
          <div style="width:${u(88)}; text-align:right; font-weight:700">${escapeHtml(
            line.totalHt,
          )}</div>
        </div>`,
      )
      .join('')}
  </div>

  <div class="dc-keep" style="padding:${u(18)} ${u(GUTTER)}; display:flex; gap:${u(
    18,
  )}; background:${BAND}; font-size:${u(11)}; font-variant-numeric:tabular-nums">
    ${[...totals.rows, { label: 'Total TTC', value: totals.totalTtc }]
      .map((row) => summaryCell(row.label, row.value))
      .join('')}
  </div>

  <div class="dc-keep" style="padding:${u(20)} ${u(
    GUTTER,
  )}; display:flex; justify-content:space-between; align-items:center; gap:${u(
    20,
  )}; border-bottom:1px solid #E7EAEF">
    <div style="font-size:${u(11)}; color:${MUTED}">${escapeHtml(
      totals.deposit ? `Acompte encaissé — ${totals.deposit.replace('− ', '')}` : (context.notes ?? ''),
    )}</div>
    <div style="display:flex; align-items:baseline; gap:${u(16)}; flex-shrink:0">
      <span style="font-size:${u(11)}; letter-spacing:${u(
        1.4,
      )}; text-transform:uppercase; color:${MUTED}">${escapeHtml(labels.amountDue)}</span>
      <span style="font-size:${u(30)}; font-weight:800; letter-spacing:${u(-1)}">${escapeHtml(
        totals.amountDue,
      )}</span>
    </div>
  </div>

  <div class="dc-spacer"></div>

  <div class="dc-keep" style="padding:0 ${u(GUTTER)} ${u(32)}; display:flex; gap:${u(
    28,
  )}; font-size:${u(9.5)}; line-height:1.8; color:#8A93A1">
    <div style="flex:1; min-width:0">
      ${
        context.payment.summary
          ? `<span style="color:${INK}; font-weight:700; font-size:${u(
              10.5,
            )}">${escapeHtml(labels.payment)}</span><br/>${escapeHtml(context.payment.summary)}`
          : ''
      }
    </div>
    <div style="flex:1; min-width:0">${legalBlock(context.legalMentions, {
      color: '#8A93A1',
    })}</div>
  </div>
</div>`;
}

export const template19: PdfTemplateDefinition = {
  id: '19',
  name: 'Full-width Modern',
  description: 'Bandes pleine largeur sans marges : chaque bloc d’information occupe toute la page.',
  accent: INK,
  paper: '#FFFFFF',
  render,
};
