import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import {
  FONTS,
  addressLines,
  escapeHtml,
  legalBlock,
  lineTable,
  qrSlot,
  u,
} from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';

const INK = '#1B1B20';
const MUTED = '#6A6A76';
const LABEL = '#9A9AA6';
const RULE = '#EDEDF1';

function shortNumber(value: string): string {
  const tail = value.split(/[-/\s]/).pop();
  return tail && /\d/.test(tail) ? tail.replace(/^0+(?=\d)/, '') : value;
}

/** Modèle sans logo : c'est le nom en serif centré qui porte l'identité. */
function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;

  return `<div class="dc-page" style="font-family:${FONTS.sourceSerif}; color:${INK}; background:#fff; padding:${u(
    60,
  )} ${u(64)} ${u(46)}">
  <div style="text-align:center; border-bottom:1px solid ${INK}; padding-bottom:${u(22)}">
    <div style="font-size:${u(26)}; letter-spacing:${u(0.5)}">${escapeHtml(issuer.name)}</div>
    <div style="font-family:${FONTS.plexSans}; font-size:${u(10)}; color:#7A7A86; margin-top:${u(
      7,
    )}">${escapeHtml(
      [
        issuer.addressLines.join(', '),
        issuer.siret ? `SIRET ${issuer.siret}` : '',
        issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '',
        issuer.phone ?? '',
        issuer.email ?? '',
      ]
        .filter(Boolean)
        .join(' · '),
    )}</div>
  </div>

  <div style="display:flex; justify-content:space-between; gap:${u(30)}; margin-top:${u(
    28,
  )}; font-family:${FONTS.plexSans}">
    <div style="max-width:${u(280)}">
      <div style="font-size:${u(9.5)}; letter-spacing:${u(
        1.5,
      )}; text-transform:uppercase; color:${LABEL}">${escapeHtml(labels.billedTo)}</div>
      <div style="font-size:${u(11.5)}; line-height:1.75; margin-top:${u(7)}">
        <strong>${escapeHtml(client.name)}</strong><br/>
        ${addressLines([
          client.contactName ? `À l'attention de ${client.contactName}` : '',
          ...client.addressLines,
          client.vatNumber ? `TVA ${client.vatNumber}` : '',
        ])}
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-family:${FONTS.sourceSerif}; font-size:${u(22)}">${escapeHtml(
        labels.document,
      )} n° ${escapeHtml(shortNumber(context.number))}</div>
      <div style="font-size:${u(11)}; line-height:1.75; color:${MUTED}; margin-top:${u(
        6,
      )}">${addressLines([
        context.number,
        ...context.meta.map((entry) => `${entry.label} : ${entry.value}`),
      ])}</div>
    </div>
  </div>

  <div style="margin-top:${u(30)}; font-family:${FONTS.plexSans}">
    ${lineTable(context, {
      headBorder: `1px solid ${INK}`,
      headColor: LABEL,
      headSize: 9.5,
      headTracking: 1.3,
      rowBorder: `1px solid ${RULE}`,
      valueColor: INK,
      rowPadding: 11,
    })}
  </div>

  <div class="dc-keep" style="display:flex; justify-content:flex-end; margin-top:${u(
    20,
  )}; font-family:${FONTS.plexSans}">
    <div style="width:${u(320)}; font-size:${u(11.5)}; font-variant-numeric:tabular-nums">
      ${totals.rows
        .map(
          (row) =>
            `<div style="display:flex; justify-content:space-between; padding:${u(
              5,
            )} 0"><span style="color:${MUTED}">${escapeHtml(row.label)}</span><span>${escapeHtml(
              row.value,
            )}</span></div>`,
        )
        .join('')}
      <div style="display:flex; justify-content:space-between; padding:${u(
        5,
      )} 0; border-top:1px solid ${RULE}; margin-top:${u(
        4,
      )}"><span style="color:${MUTED}">Total TTC</span><span>${escapeHtml(totals.totalTtc)}</span></div>
      ${
        totals.deposit
          ? `<div style="display:flex; justify-content:space-between; padding:${u(
              5,
            )} 0"><span style="color:${MUTED}">Acompte versé</span><span>${escapeHtml(
              totals.deposit,
            )}</span></div>`
          : ''
      }
      <div style="display:flex; justify-content:space-between; align-items:baseline; border-top:1px solid ${INK}; margin-top:${u(
        8,
      )}; padding-top:${u(12)}">
        <span style="font-family:${FONTS.sourceSerif}; font-size:${u(15)}">${escapeHtml(
          labels.amountDue,
        )}</span>
        <span style="font-family:${FONTS.sourceSerif}; font-size:${u(26)}">${escapeHtml(
          totals.amountDue,
        )}</span>
      </div>
    </div>
  </div>

  ${
    context.notes
      ? `<div style="font-family:${FONTS.plexSans}; margin-top:${u(18)}; font-size:${u(
          11,
        )}; line-height:1.7; color:${MUTED}">${escapeHtml(context.notes)}</div>`
      : ''
  }

  <div class="dc-spacer"></div>

  <div class="dc-keep" style="display:flex; gap:${u(26)}; align-items:flex-end; font-family:${
    FONTS.plexSans
  }; border-top:1px solid ${RULE}; padding-top:${u(16)}">
    <div style="flex:1">
      ${legalBlock([context.payment.summary ?? '', ...context.legalMentions].filter(Boolean), {
        color: '#8A8A99',
        lineHeight: 1.85,
      })}
    </div>
    ${qrSlot(context.qrSvg, 56)}
  </div>
</div>`;
}

export const template10: PdfTemplateDefinition = {
  id: '10',
  name: 'Elegant Serif',
  description: 'Sans logo : le nom en serif centré fait l’identité. Filets fins, tout en retenue.',
  accent: null,
  paper: '#FFFFFF',
  render,
};
