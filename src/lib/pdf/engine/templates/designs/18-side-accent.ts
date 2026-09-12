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

const BLUE = '#1D6FD1';
const INK = '#1A1D24';
const MUTED = '#6B7480';
const BODY = '#5A6270';
const LABEL = '#98A1AD';

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;

  return `<div class="dc-page" style="font-family:${FONTS.manrope}; color:${INK}; background:#fff; flex-direction:row">
  <div style="width:${u(12)}; background:${BLUE}; flex-shrink:0"></div>

  <div style="flex:1; min-width:0; padding:${u(52)} ${u(50)} ${u(40)} ${u(
    38,
  )}; display:flex; flex-direction:column">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:${u(24)}">
      <div style="min-width:0">
        <div style="font-size:${u(11)}; letter-spacing:${u(
          2.4,
        )}; text-transform:uppercase; color:${BLUE}; font-weight:800">${escapeHtml(
          labels.document,
        )}</div>
        <div style="font-size:${u(32)}; font-weight:800; letter-spacing:${u(
          -1.2,
        )}; margin-top:${u(6)}">${escapeHtml(context.number)}</div>
        ${
          context.meta.length > 0
            ? `<div style="font-size:${u(11)}; color:${MUTED}; margin-top:${u(5)}">${escapeHtml(
                context.meta.map((entry) => `${entry.label} ${entry.value}`).join(' · '),
              )}</div>`
            : ''
        }
      </div>
      <div style="text-align:right; flex-shrink:0">
        ${logoBanner(context.logoUrl, { maxHeight: 32, marginBottom: 8, align: 'right' })}
        <div style="font-size:${u(15)}; font-weight:800">${escapeHtml(issuer.name)}</div>
        <div style="font-size:${u(10.5)}; line-height:1.7; color:${MUTED}; margin-top:${u(
          4,
        )}">${addressLines([
          ...issuer.addressLines,
          issuer.siret ? `SIRET ${issuer.siret}` : '',
          issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '',
        ])}</div>
      </div>
    </div>

    <div style="display:flex; gap:${u(30)}; margin-top:${u(32)}; padding-bottom:${u(
      22,
    )}; border-bottom:${u(2)} solid ${INK}">
      <div style="flex:1; min-width:0">
        <div style="font-size:${u(9.5)}; letter-spacing:${u(
          1.4,
        )}; text-transform:uppercase; color:${LABEL}">Client</div>
        <div style="font-size:${u(13.5)}; font-weight:800; margin-top:${u(6)}">${escapeHtml(
          client.name,
        )}</div>
        <div style="font-size:${u(11)}; line-height:1.7; color:${BODY}; margin-top:${u(
          3,
        )}">${escapeHtml(
          [
            client.contactName ? `À l'attention de ${client.contactName}` : '',
            client.addressLines.join(', '),
            client.vatNumber ? `TVA ${client.vatNumber}` : '',
          ]
            .filter(Boolean)
            .join(' · '),
        )}</div>
      </div>
      <div style="width:${u(200)}; flex-shrink:0; border-left:${u(2)} solid ${BLUE}; padding-left:${u(
        16,
      )}">
        <div style="font-size:${u(9.5)}; letter-spacing:${u(
          1.4,
        )}; text-transform:uppercase; color:${LABEL}">${escapeHtml(labels.amountDue)}</div>
        <div style="font-size:${u(27)}; font-weight:800; letter-spacing:${u(-1)}; margin-top:${u(
          4,
        )}">${escapeHtml(totals.amountDue)}</div>
        ${
          totals.deposit
            ? `<div style="font-size:${u(10.5)}; color:${MUTED}; margin-top:${u(
                3,
              )}">Acompte de ${escapeHtml(totals.deposit.replace('− ', ''))} déduit</div>`
            : ''
        }
      </div>
    </div>

    <div style="margin-top:${u(22)}">
      ${lineTable(context, {
        headBorder: 'none',
        headColor: LABEL,
        headSize: 9.5,
        headTracking: 1.2,
        rowBorder: '1px solid #EBEEF2',
        valueColor: BODY,
        descriptionColor: '#8B94A1',
        labelColor: INK,
        rowPadding: 10,
      })}
    </div>

    <div class="dc-keep" style="display:flex; justify-content:flex-end; margin-top:${u(20)}">
      <div style="width:${u(320)}; font-size:${u(11.5)}; font-variant-numeric:tabular-nums">
        ${[...totals.rows, { label: 'Total TTC', value: totals.totalTtc }]
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
          9,
        )} 0 0; margin-top:${u(5)}; border-top:${u(2)} solid ${BLUE}; font-size:${u(
          14,
        )}; font-weight:800"><span>${escapeHtml(labels.amountDue)}</span><span>${escapeHtml(
          totals.amountDue,
        )}</span></div>
      </div>
    </div>

    ${
      context.notes
        ? `<div style="margin-top:${u(16)}; font-size:${u(
            11,
          )}; line-height:1.7; color:${BODY}">${escapeHtml(context.notes)}</div>`
        : ''
    }

    <div class="dc-spacer"></div>

    <div class="dc-keep" style="display:flex; gap:${u(20)}; align-items:flex-end">
      ${qrSlot(context.qrSvg, 58)}
      <div style="flex:1">
        ${legalBlock([context.payment.summary ?? '', ...context.legalMentions].filter(Boolean), {
          color: '#8B94A1',
          lineHeight: 1.85,
        })}
      </div>
    </div>
  </div>
</div>`;
}

export const template18: PdfTemplateDefinition = {
  id: '18',
  name: 'Side Accent',
  description: 'Un filet de couleur pleine hauteur en marge et une colonne de repères. Sobre et lisible.',
  accent: BLUE,
  paper: '#FFFFFF',
  render,
};
