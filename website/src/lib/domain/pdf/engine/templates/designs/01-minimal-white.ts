import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import {
  FONTS,
  addressLines,
  escapeHtml,
  lineTable,
  logoMark,
  qrSlot,
  sectionLabel,
  totalsRows,
  u,
} from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';

const MUTED = '#6C6C78';
const LABEL = '#9A9AA6';
const RULE = '#E4E4EA';
const INK = '#1A1A22';

function metaColumn(entries: { label: string; value: string; strong?: boolean }[]): string {
  return entries
    .map(
      (entry, index) =>
        `${sectionLabel(entry.label, { color: LABEL, marginTop: index === 0 ? 0 : 18 })}
         <div style="font-size:${u(13)}; font-weight:${entry.strong ? 700 : 600}; margin-top:${u(8)}">${escapeHtml(
           entry.value,
         )}</div>`,
    )
    .join('');
}

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;
  const half = Math.ceil(context.meta.length / 2);

  return `<div class="dc-page" style="font-family:${FONTS.jakarta}; color:${INK}; background:#fff; padding:${u(
    44,
  )} ${u(54)}">
  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:${u(24)}">
    <div>
      <div style="display:flex; align-items:center; gap:${u(10)}">
        ${logoMark(context.logoUrl, issuer.initials, { size: 30, border: `${u(1.5)} solid ${INK}` })}
        <div style="font-size:${u(17)}; font-weight:700; letter-spacing:${u(-0.3)}">${escapeHtml(issuer.name)}</div>
      </div>
      <div style="font-size:${u(10.5)}; line-height:1.7; color:${MUTED}; margin-top:${u(14)}">
        ${addressLines([
          ...issuer.addressLines,
          issuer.siret ? `SIRET ${issuer.siret}` : '',
          issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '',
        ])}
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:${u(30)}; font-weight:300; letter-spacing:${u(5)}; text-transform:uppercase">${escapeHtml(
        labels.document,
      )}</div>
      <div style="font-family:${FONTS.plexMono}; font-size:${u(12)}; color:${MUTED}; margin-top:${u(
        8,
      )}">${escapeHtml(context.number)}</div>
    </div>
  </div>

  <div style="height:1px; background:${RULE}; margin:${u(26)} 0 ${u(22)}"></div>

  <div style="display:flex; gap:${u(28)}; align-items:flex-start">
    <div style="flex:1.4">
      ${sectionLabel(labels.billedTo, { color: LABEL })}
      <div style="font-size:${u(13)}; font-weight:700; margin-top:${u(8)}">${escapeHtml(client.name)}</div>
      <div style="font-size:${u(10.5)}; line-height:1.7; color:${MUTED}; margin-top:${u(4)}">
        ${addressLines([
          client.contactName ? `À l'attention de ${client.contactName}` : '',
          ...client.addressLines,
          client.vatNumber ? `TVA ${client.vatNumber}` : '',
        ])}
      </div>
    </div>
    <div style="flex:1">${metaColumn(context.meta.slice(0, half))}</div>
    <div style="flex:1">
      ${metaColumn(context.meta.slice(half))}
      ${sectionLabel(labels.amountDue, { color: LABEL, marginTop: context.meta.length > half ? 18 : 0 })}
      <div style="font-size:${u(15)}; font-weight:800; margin-top:${u(8)}">${escapeHtml(totals.amountDue)}</div>
    </div>
  </div>

  <div style="margin-top:${u(26)}">
    ${lineTable(context, {
      headBorder: `1px solid ${INK}`,
      rowBorder: `1px solid #EFEFF3`,
      headColor: LABEL,
      valueColor: '#4A4A58',
    })}
  </div>

  <div class="dc-keep" style="display:flex; justify-content:flex-end; margin-top:${u(22)}">
    <div style="width:${u(330)}">
      ${totalsRows(
        {
          rows: [
            ...totals.rows,
            { label: 'Total TTC', value: totals.totalTtc, strong: true },
            ...(totals.deposit
              ? [{ label: 'Acompte reçu', value: totals.deposit, borderBottom: `1px solid ${INK}` }]
              : []),
          ],
          finalLabel: labels.amountDue,
          finalValue: totals.amountDue,
        },
        { finalBorderTop: `1px solid ${INK}` },
      )}
    </div>
  </div>

  ${
    context.notes
      ? `<div style="margin-top:${u(20)}; font-size:${u(10.5)}; line-height:1.7; color:${MUTED}">${escapeHtml(
          context.notes,
        )}</div>`
      : ''
  }

  <div class="dc-spacer"></div>

  <div class="dc-keep" style="display:flex; gap:${u(30)}; align-items:flex-end; border-top:1px solid ${RULE}; padding-top:${u(
    20,
  )}">
    <div style="flex:1">
      ${sectionLabel(labels.payment, { color: LABEL })}
      <div style="font-size:${u(10.5)}; line-height:1.75; color:#4A4A58; margin-top:${u(7)}">
        ${addressLines([context.payment.summary ?? '', ...context.legalMentions])}
      </div>
    </div>
    ${qrSlot(context.qrSvg, 62)}
  </div>
</div>`;
}

export const template01: PdfTemplateDefinition = {
  id: '01',
  name: 'Minimal White',
  description: 'Blanc total, filets fins, aucune couleur. La hiérarchie repose sur la graisse et l’espace.',
  accent: null,
  paper: '#FFFFFF',
  render,
};
