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

const DARK = '#1A1815';
const OCHRE = '#C2621B';
const MUTED = '#5C564C';
const LABEL = '#8A8378';

function column(label: string, lines: string[], options: { firstLineBold?: boolean } = {}): string {
  const [first, ...rest] = lines.filter(Boolean);

  return `<div style="flex:1; min-width:0">
    <div style="font-size:${u(9)}; letter-spacing:${u(
      1.6,
    )}; color:${LABEL}; text-transform:uppercase">${escapeHtml(label)}</div>
    <div style="font-size:${u(11.5)}; line-height:1.65; margin-top:${u(6)}">${
      first
        ? `<span style="${
            options.firstLineBold ? 'font-weight:700; text-transform:uppercase;' : ''
          }">${escapeHtml(first)}</span>${rest.length > 0 ? '<br/>' : ''}`
        : ''
    }${addressLines(rest)}</div>
  </div>`;
}

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;
  const dates = context.meta.map((entry) => `${entry.label.toUpperCase()} ${entry.value}`).join(' · ');

  return `<div class="dc-page" style="font-family:${FONTS.archivo}; color:${DARK}; background:#F7F6F3; padding:0">
  <div style="display:flex; align-items:stretch">
    <div style="background:${DARK}; color:#fff; padding:${u(28)} ${u(30)}; flex:1; min-width:0">
      ${logoBanner(context.logoUrl, { maxHeight: 32, marginBottom: 10 })}
      <div style="font-size:${u(22)}; font-weight:800; letter-spacing:${u(
        2,
      )}; text-transform:uppercase">${escapeHtml(issuer.name)}</div>
      ${
        issuer.addressLines.length > 0
          ? `<div style="font-size:${u(10)}; letter-spacing:${u(
              2,
            )}; color:#B8B2A6; margin-top:${u(5)}; text-transform:uppercase">${escapeHtml(
              issuer.addressLines.join(' · '),
            )}</div>`
          : ''
      }
    </div>
    <div style="background:${OCHRE}; color:#fff; padding:${u(28)} ${u(30)}; width:${u(270)}">
      <div style="font-size:${u(10)}; letter-spacing:${u(2)}; text-transform:uppercase">${escapeHtml(
        labels.document,
      )}</div>
      <div style="font-size:${u(19)}; font-weight:800; margin-top:${u(4)}">${escapeHtml(
        context.number,
      )}</div>
      ${
        dates
          ? `<div style="font-size:${u(10)}; margin-top:${u(
              6,
            )}; color:rgba(255,255,255,.85); text-transform:uppercase">${escapeHtml(dates)}</div>`
          : ''
      }
    </div>
  </div>

  <div style="padding:${u(26)} ${u(30)} 0; display:flex; gap:${u(18)}">
    ${column(
      'Client',
      [
        client.name,
        client.contactName ?? '',
        ...client.addressLines,
        client.vatNumber ? `TVA ${client.vatNumber}` : '',
      ],
      { firstLineBold: true },
    )}
    ${column(labels.issuer, [
      ...issuer.addressLines,
      issuer.siret ? `SIRET ${issuer.siret}` : '',
      issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '',
    ])}
    ${column(labels.amountDue, [
      totals.amountDue,
      context.payment.terms ?? '',
      ...context.payment.methods.slice(0, 1),
    ])}
  </div>

  <div style="padding:${u(24)} ${u(30)} 0">
    ${lineTable(context, {
      columns: ['index', 'vat'],
      headBackground: DARK,
      headColor: '#fff',
      headBorder: 'none',
      headSize: 9.5,
      headTracking: 1.2,
      rowBorder: `${u(2)} solid #E4E0D8`,
      valueColor: DARK,
      descriptionColor: LABEL,
      labelColor: DARK,
      rowPadding: 10,
    })}
  </div>

  <div class="dc-keep" style="padding:${u(22)} ${u(30)} 0; display:flex; gap:${u(
    20,
  )}; align-items:flex-start">
    <div style="flex:1; font-size:${u(10.5)}; line-height:1.85; color:${MUTED}">
      <div style="font-size:${u(9)}; letter-spacing:${u(1.6)}; color:${LABEL}">RÈGLEMENT</div>
      ${addressLines([
        context.payment.summary ?? '',
        totals.deposit ? `Acompte de ${totals.deposit.replace('− ', '')} encaissé.` : '',
        context.notes ?? '',
      ])}
    </div>
    <div style="width:${u(300)}; font-size:${u(11.5)}; background:#fff; border:${u(
      2,
    )} solid ${DARK}; font-variant-numeric:tabular-nums">
      ${[...totals.rows, { label: 'Total TTC', value: totals.totalTtc }]
        .map(
          (row, index, all) =>
            `<div style="display:flex; justify-content:space-between; padding:${u(7)} ${u(12)}; ${
              index === all.length - 1 ? 'border-top:1px solid #E4E0D8;' : ''
            }"><span style="color:#6E6759; text-transform:uppercase">${escapeHtml(
              row.label,
            )}</span><span>${escapeHtml(row.value)}</span></div>`,
        )
        .join('')}
      ${
        totals.deposit
          ? `<div style="display:flex; justify-content:space-between; padding:${u(7)} ${u(
              12,
            )}"><span style="color:#6E6759">ACOMPTE</span><span>${escapeHtml(
              totals.deposit,
            )}</span></div>`
          : ''
      }
      <div style="display:flex; justify-content:space-between; padding:${u(11)} ${u(
        12,
      )}; background:${OCHRE}; color:#fff; font-size:${u(
        15,
      )}; font-weight:800; text-transform:uppercase"><span>${escapeHtml(
        labels.amountDue,
      )}</span><span>${escapeHtml(totals.amountDue)}</span></div>
    </div>
  </div>

  <div class="dc-spacer"></div>

  <div class="dc-keep" style="display:flex; gap:${u(20)}; align-items:flex-end; padding:0 ${u(
    30,
  )} ${u(26)}">
    <div style="flex:1">
      ${legalBlock(
        context.legalMentions.map((mention) => mention.toUpperCase()),
        { color: LABEL, size: 9, lineHeight: 1.85 },
      )}
    </div>
    ${qrSlot(context.qrSvg, 58)}
  </div>
</div>`;
}

export const template14: PdfTemplateDefinition = {
  id: '14',
  name: 'Industrial',
  description: 'Capitales, bandes pleines et ocre de chantier. Pensé pour le bâtiment.',
  accent: OCHRE,
  paper: '#F7F6F3',
  render,
};
