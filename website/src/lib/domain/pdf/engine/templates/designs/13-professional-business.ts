import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import {
  FONTS,
  addressLines,
  escapeHtml,
  legalBlock,
  lineTable,
  logoMark,
  qrSlot,
  u,
  vatRecapTable,
} from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';

const INK = '#22252B';
const MUTED = '#6B7280';
const LABEL = '#9AA1AC';
const BORDER = '#D6DAE0';
const HEAD_BG = '#F1F3F6';

/** Cartouche encadré : une ligne « libellé | valeur » par information. */
function cartoucheRow(label: string, value: string, last = false): string {
  return `<div style="display:flex; ${last ? '' : `border-bottom:1px solid ${BORDER};`}">
    <div style="flex:1; padding:${u(8)} ${u(12)}; font-size:${u(
      10,
    )}; color:${MUTED}; border-right:1px solid ${BORDER}">${escapeHtml(label)}</div>
    <div style="flex:1; padding:${u(8)} ${u(12)}; font-size:${u(11)}; font-weight:600">${escapeHtml(
      value,
    )}</div>
  </div>`;
}

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;

  const cartoucheEntries = [
    { label: `${labels.document} n°`, value: context.number },
    ...context.meta.map((entry) => ({ label: entry.label, value: entry.value })),
  ];

  return `<div class="dc-page" style="font-family:${FONTS.plexSans}; color:${INK}; background:#fff; padding:${u(
    46,
  )} ${u(54)} ${u(40)}">
  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:${u(
    20,
  )}; border-bottom:${u(2)} solid ${INK}; padding-bottom:${u(14)}">
    <div style="display:flex; gap:${u(12)}; align-items:center">
      ${logoMark(context.logoUrl, issuer.initials, {
        size: 38,
        border: `${u(2)} solid ${INK}`,
        fontSize: 13,
        fontWeight: 600,
      })}
      <div>
        <div style="font-size:${u(16)}; font-weight:600; letter-spacing:${u(
          0.2,
        )}; text-transform:uppercase">${escapeHtml(issuer.name)}</div>
      </div>
    </div>
    <div style="font-size:${u(10)}; line-height:1.7; text-align:right; color:${MUTED}">
      ${addressLines([
        issuer.addressLines.join(', '),
        [issuer.phone, issuer.email].filter(Boolean).join(' · '),
        [issuer.siret ? `SIRET ${issuer.siret}` : '', issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '']
          .filter(Boolean)
          .join(' · '),
      ])}
    </div>
  </div>

  <div style="display:flex; justify-content:space-between; gap:${u(24)}; margin-top:${u(
    30,
  )}; align-items:flex-start">
    <div style="font-size:${u(11)}; line-height:1.7; color:${MUTED}">
      <div style="font-size:${u(9.5)}; letter-spacing:${u(
        1.4,
      )}; text-transform:uppercase; color:${LABEL}">${escapeHtml(
        context.kind === 'quote' ? 'Destinataire' : 'Doit',
      )}</div>
      <div style="color:${INK}; font-size:${u(13)}; font-weight:600; margin-top:${u(
        6,
      )}">${escapeHtml(client.name)}</div>
      ${addressLines([
        client.contactName ? `À l'attention de ${client.contactName}` : '',
        ...client.addressLines,
        client.vatNumber ? `TVA intracom. ${client.vatNumber}` : '',
      ])}
    </div>
    <div style="border:1px solid ${BORDER}; min-width:${u(272)}">
      ${cartoucheEntries
        .map((entry, index) =>
          cartoucheRow(entry.label, entry.value, index === cartoucheEntries.length - 1),
        )
        .join('')}
    </div>
  </div>

  <div style="margin-top:${u(26)}; border:1px solid ${BORDER}">
    <div style="padding:0 ${u(8)}">
      ${lineTable(context, {
        columns: ['index', 'vat'],
        headBackground: HEAD_BG,
        headBorder: 'none',
        headColor: '#5B6472',
        headSize: 9.5,
        headTracking: 0.8,
        rowBorder: '1px solid #E6E9ED',
        fontSize: 11,
        descriptionColor: '#7A8290',
        valueColor: INK,
        rowPadding: 9,
      })}
    </div>
  </div>

  <div class="dc-keep" style="display:flex; gap:${u(20)}; margin-top:${u(22)}; align-items:flex-start">
    <div style="flex:1">
      ${
        totals.vat.length > 0
          ? `<div style="font-size:${u(9.5)}; letter-spacing:${u(
              1.2,
            )}; text-transform:uppercase; color:${LABEL}; margin-bottom:${u(
              7,
            )}">Récapitulatif de TVA</div>
             ${vatRecapTable(totals.vat, { border: `1px solid ${BORDER}`, headBackground: HEAD_BG })}`
          : ''
      }
    </div>
    <div style="width:${u(290)}; border:1px solid ${BORDER}; font-size:${u(
      11,
    )}; font-variant-numeric:tabular-nums">
      ${totals.rows
        .map(
          (row) =>
            `<div style="display:flex; justify-content:space-between; padding:${u(7)} ${u(
              12,
            )}"><span style="color:${MUTED}">${escapeHtml(row.label)}</span><span>${escapeHtml(
              row.value,
            )}</span></div>`,
        )
        .join('')}
      <div style="display:flex; justify-content:space-between; padding:${u(7)} ${u(
        12,
      )}; border-top:1px solid #E6E9ED; font-weight:600"><span>Total TTC</span><span>${escapeHtml(
        totals.totalTtc,
      )}</span></div>
      ${
        totals.deposit
          ? `<div style="display:flex; justify-content:space-between; padding:${u(7)} ${u(
              12,
            )}"><span style="color:${MUTED}">Acompte</span><span>${escapeHtml(
              totals.deposit,
            )}</span></div>`
          : ''
      }
      <div style="display:flex; justify-content:space-between; padding:${u(10)} ${u(
        12,
      )}; background:${INK}; color:#fff; font-size:${u(13)}; font-weight:600"><span>${escapeHtml(
        labels.amountDue,
      )}</span><span>${escapeHtml(totals.amountDue)}</span></div>
    </div>
  </div>

  ${
    context.notes
      ? `<div style="margin-top:${u(18)}; font-size:${u(
          10.5,
        )}; line-height:1.7; color:${MUTED}">${escapeHtml(context.notes)}</div>`
      : ''
  }

  <div class="dc-spacer"></div>

  <div class="dc-keep" style="display:flex; gap:${u(
    22,
  )}; align-items:flex-end; border-top:1px solid ${BORDER}; padding-top:${u(14)}">
    <div style="flex:1">
      ${legalBlock([context.payment.summary ?? '', ...context.legalMentions].filter(Boolean), {
        color: '#7A8290',
      })}
    </div>
    ${qrSlot(context.qrSvg, 54)}
  </div>
</div>`;
}

export const template13: PdfTemplateDefinition = {
  id: '13',
  name: 'Professional Business',
  description: 'Papier à en-tête classique, cartouche de références encadré, récapitulatif de TVA détaillé.',
  accent: INK,
  paper: '#FFFFFF',
  render,
};
