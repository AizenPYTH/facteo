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

const CORAL = '#E8574C';
const INK = '#1C1620';
const MUTED = '#6B6373';
const LABEL = '#A79EAC';

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;

  return `<div class="dc-page" style="font-family:${FONTS.grotesk}; color:${INK}; background:#fff; flex-direction:row">
  <div style="width:${u(74)}; background:${CORAL}; color:#fff; display:flex; align-items:flex-end; justify-content:center; padding:${u(
    30,
  )} 0; flex-shrink:0">
    <div style="writing-mode:vertical-rl; transform:rotate(180deg); font-size:${u(
      13,
    )}; letter-spacing:${u(5)}; text-transform:uppercase; white-space:nowrap">${escapeHtml(
      `${labels.document} ${context.number}`,
    )}</div>
  </div>

  <div style="flex:1; min-width:0; padding:${u(48)} ${u(44)} ${u(
    38,
  )}; display:flex; flex-direction:column">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:${u(20)}">
      <div style="min-width:0">
        ${logoBanner(context.logoUrl, { maxHeight: 34, marginBottom: 10 })}
        <div style="font-size:${u(26)}; font-weight:700; letter-spacing:${u(-1)}">${escapeHtml(
          issuer.name,
        )}</div>
        <div style="font-size:${u(10.5)}; line-height:1.7; color:#7B7280; margin-top:${u(
          6,
        )}">${addressLines([
          [issuer.addressLines.join(', '), issuer.siret ? `SIRET ${issuer.siret}` : '']
            .filter(Boolean)
            .join(' · '),
          [issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '', issuer.email ?? '']
            .filter(Boolean)
            .join(' · '),
        ])}</div>
      </div>
      ${qrSlot(context.qrSvg, 62)}
    </div>

    <div style="display:flex; gap:${u(30)}; margin-top:${u(34)}">
      <div style="flex:1; min-width:0">
        <div style="font-size:${u(9.5)}; letter-spacing:${u(
          1.5,
        )}; text-transform:uppercase; color:${LABEL}">Pour</div>
        <div style="font-size:${u(14)}; font-weight:700; margin-top:${u(6)}">${escapeHtml(
          client.name,
        )}</div>
        <div style="font-size:${u(11)}; line-height:1.7; color:${MUTED}; margin-top:${u(
          3,
        )}">${addressLines([
          client.contactName ?? '',
          client.addressLines.join(', '),
          client.vatNumber ? `TVA ${client.vatNumber}` : '',
        ])}</div>
      </div>
      ${
        context.meta.length > 0
          ? `<div style="width:${u(190)}; flex-shrink:0">
               <div style="font-size:${u(9.5)}; letter-spacing:${u(
                 1.5,
               )}; text-transform:uppercase; color:${LABEL}">Dates</div>
               <div style="font-size:${u(11)}; line-height:1.8; margin-top:${u(
                 6,
               )}">${addressLines(
                 context.meta.map((entry) => `${entry.label} ${entry.value}`),
               )}</div>
             </div>`
          : ''
      }
    </div>

    <div style="margin-top:${u(30)}">
      ${LINES_ANCHOR}
      ${context.lines
        .map(
          (line) => `<div style="display:flex; gap:${u(10)}; padding:${u(
            11,
          )} 0; border-bottom:1px solid #EEEAF0; font-size:${u(
            11.5,
          )}; align-items:baseline; font-variant-numeric:tabular-nums">
            <div style="flex:1; min-width:0">
              <div style="font-weight:700">${escapeHtml(line.title)}</div>
              ${
                line.description
                  ? `<div style="font-size:${u(10)}; color:#9A91A0; margin-top:${u(
                      2,
                    )}; line-height:1.45">${escapeMultiline(line.description)}</div>`
                  : ''
              }
            </div>
            <div style="width:${u(120)}; color:${MUTED}; flex-shrink:0">${escapeHtml(
              `${line.quantity} × ${line.unitPrice}`,
            )}</div>
            <div style="width:${u(40)}; color:#9A91A0; text-align:right; flex-shrink:0">${escapeHtml(
              line.vatRate,
            )}</div>
            <div style="width:${u(88)}; text-align:right; font-weight:700; flex-shrink:0">${escapeHtml(
              line.totalHt,
            )}</div>
          </div>`,
        )
        .join('')}
    </div>

    <div class="dc-keep" style="display:flex; justify-content:space-between; gap:${u(
      24,
    )}; align-items:flex-end; margin-top:${u(26)}">
      <div style="font-size:${u(10.5)}; line-height:1.85; color:${MUTED}">
        <span style="font-weight:700; color:${INK}">Paiement</span><br/>
        ${addressLines([
          context.payment.iban ? `IBAN ${context.payment.iban}` : '',
          [
            context.payment.bic ? `BIC ${context.payment.bic}` : '',
            totals.deposit ? `Acompte reçu ${totals.deposit.replace('− ', '')}` : '',
          ]
            .filter(Boolean)
            .join(' · '),
        ])}
      </div>
      <div style="text-align:right; font-size:${u(
        11,
      )}; line-height:1.85; color:${MUTED}; font-variant-numeric:tabular-nums">
        ${[...totals.rows, { label: 'Total TTC', value: totals.totalTtc }]
          .map(
            (row) =>
              `${escapeHtml(row.label)} <span style="color:${INK}">${escapeHtml(row.value)}</span>`,
          )
          .join('<br/>')}
      </div>
    </div>

    <div class="dc-keep" style="background:${INK}; color:#fff; margin-top:${u(18)}; padding:${u(
      18,
    )} ${u(22)}; display:flex; justify-content:space-between; align-items:center; gap:${u(20)}">
      <div style="font-size:${u(11)}; letter-spacing:${u(
        1.6,
      )}; text-transform:uppercase; color:rgba(255,255,255,.66)">${escapeHtml(labels.amountDue)}</div>
      <div style="font-size:${u(28)}; font-weight:700; letter-spacing:${u(-1)}">${escapeHtml(
        totals.amountDue,
      )}</div>
    </div>

    <div class="dc-spacer"></div>

    ${
      context.legalMentions.length > 0 || context.notes
        ? `<div style="margin-top:${u(18)}">${legalBlock(
            [context.notes ?? '', ...context.legalMentions].filter(Boolean),
            { color: LABEL },
          )}</div>`
        : ''
    }
  </div>
</div>`;
}

export const template15: PdfTemplateDefinition = {
  id: '15',
  name: 'Creative Studio',
  description: 'Composition asymétrique, colonne de couleur en bord de page, numéro à la verticale.',
  accent: CORAL,
  paper: '#FFFFFF',
  render,
};
