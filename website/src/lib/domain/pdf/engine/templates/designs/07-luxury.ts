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

const GOLD = '#C6A961';
const INK = '#211D16';
const LABEL = '#A08F6C';
const SOFT = '#8A7E68';
const RULE = '#E2D8C4';

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;
  const issuedLine = context.issuedAt ? ` · ${context.issuedAt}` : '';

  return `<div class="dc-page" style="font-family:${FONTS.baskerville}; color:${INK}; background:#FAF7F1; padding:${u(
    54,
  )} ${u(60)} ${u(44)}">
  <div style="border:1px solid ${GOLD}; padding:${u(30)} ${u(34)} ${u(
    34,
  )}; flex:1; display:flex; flex-direction:column">
    <div style="text-align:center">
      ${logoBanner(context.logoUrl, { maxHeight: 34, marginBottom: 12, align: 'center' })}
      <div style="font-size:${u(20)}; letter-spacing:${u(5)}; text-transform:uppercase">${escapeHtml(
        issuer.name,
      )}</div>
      ${
        issuer.addressLines.length > 0
          ? `<div style="font-family:${FONTS.plexSans}; font-size:${u(9.5)}; letter-spacing:${u(
              3,
            )}; text-transform:uppercase; color:#9A8B6B; margin-top:${u(7)}">${escapeHtml(
              issuer.addressLines.join(' — '),
            )}</div>`
          : ''
      }
      <div style="width:${u(54)}; height:1px; background:${GOLD}; margin:${u(18)} auto"></div>
      <div style="font-size:${u(13)}; letter-spacing:${u(
        6,
      )}; text-transform:uppercase; color:#6B6151">${escapeHtml(labels.document)}</div>
      <div style="font-family:${FONTS.plexSans}; font-size:${u(11)}; color:${SOFT}; margin-top:${u(
        6,
      )}">N° ${escapeHtml(context.number)}${escapeHtml(issuedLine)}</div>
    </div>

    <div style="display:flex; justify-content:space-between; gap:${u(30)}; margin-top:${u(
      30,
    )}; font-family:${FONTS.plexSans}">
      <div style="max-width:${u(250)}">
        <div style="font-size:${u(9)}; letter-spacing:${u(
          2,
        )}; text-transform:uppercase; color:${LABEL}">${escapeHtml(labels.billedTo)}</div>
        <div style="font-size:${u(11.5)}; line-height:1.75; margin-top:${u(7)}">
          <strong>${escapeHtml(client.name)}</strong><br/>
          ${addressLines([
            client.contactName ?? '',
            ...client.addressLines,
            client.vatNumber ? `TVA ${client.vatNumber}` : '',
          ])}
        </div>
      </div>
      ${
        context.meta.length > 0
          ? `<div style="text-align:right">
               <div style="font-size:${u(9)}; letter-spacing:${u(
                 2,
               )}; text-transform:uppercase; color:${LABEL}">${escapeHtml(
                 labels.secondaryDate,
               )}</div>
               <div style="font-size:${u(11.5)}; line-height:1.75; margin-top:${u(
                 7,
               )}">${addressLines(
                 context.meta.map((entry) =>
                   entry.label === labels.secondaryDate ? entry.value : `${entry.label} : ${entry.value}`,
                 ),
               )}</div>
             </div>`
          : ''
      }
    </div>

    <div style="margin-top:${u(26)}; font-family:${FONTS.plexSans}">
      ${lineTable(context, {
        headBorder: `1px solid ${GOLD}`,
        headColor: LABEL,
        headSize: 9,
        headTracking: 1.6,
        rowBorder: '1px solid #EDE5D6',
        fontSize: 11,
        descriptionSize: 9.5,
        descriptionColor: '#9A8B6B',
        valueColor: INK,
        rowPadding: 10,
      })}
    </div>

    <div class="dc-keep" style="display:flex; justify-content:flex-end; margin-top:${u(
      20,
    )}; font-family:${FONTS.plexSans}">
      <div style="width:${u(310)}; font-size:${u(11)}; font-variant-numeric:tabular-nums">
        ${[
          ...totals.rows,
          { label: 'Total TTC', value: totals.totalTtc },
          ...(totals.deposit ? [{ label: 'Acompte versé', value: totals.deposit }] : []),
        ]
          .map(
            (row, index, all) =>
              `<div style="display:flex; justify-content:space-between; padding:${u(5)} 0; ${
                index === all.length - 1 ? `border-bottom:1px solid ${RULE};` : ''
              }"><span style="color:#7C7264">${escapeHtml(row.label)}</span><span>${escapeHtml(
                row.value,
              )}</span></div>`,
          )
          .join('')}
        <div style="display:flex; justify-content:space-between; align-items:baseline; padding:${u(
          12,
        )} 0 0">
          <span style="font-family:${FONTS.baskerville}; font-size:${u(13)}; letter-spacing:${u(
            2,
          )}; text-transform:uppercase">${escapeHtml(labels.amountDue)}</span>
          <span style="font-family:${FONTS.baskerville}; font-size:${u(24)}">${escapeHtml(
            totals.amountDue,
          )}</span>
        </div>
      </div>
    </div>

    ${
      context.notes
        ? `<div style="font-family:${FONTS.plexSans}; margin-top:${u(18)}; font-size:${u(
            10.5,
          )}; line-height:1.7; color:${SOFT}">${escapeHtml(context.notes)}</div>`
        : ''
    }

    <div class="dc-spacer"></div>

    <div class="dc-keep" style="display:flex; align-items:flex-end; gap:${u(24)}; font-family:${
      FONTS.plexSans
    }; border-top:1px solid ${RULE}; padding-top:${u(16)}">
      <div style="flex:1">
        ${legalBlock(
          [
            context.payment.summary ?? '',
            ...context.legalMentions,
            issuer.siret ? `SIRET ${issuer.siret}` : '',
          ].filter(Boolean),
          { color: SOFT },
        )}
      </div>
      ${qrSlot(context.qrSvg, 58)}
    </div>
  </div>
</div>`;
}

export const template07: PdfTemplateDefinition = {
  id: '07',
  name: 'Luxury',
  description: 'Papier crème, cadre intérieur doré, titre centré en capitales espacées.',
  accent: GOLD,
  paper: '#FAF7F1',
  render,
};
