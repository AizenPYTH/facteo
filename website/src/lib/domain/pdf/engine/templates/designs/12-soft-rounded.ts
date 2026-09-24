import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import {
  FONTS,
  addressLines,
  escapeHtml,
  escapeMultiline,
  legalBlock,
  logoMark,
  qrSlot,
  u,
  LINES_ANCHOR,
} from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';

const INK = '#1D2430';
const PANEL = '#F4F6F9';
const MUTED = '#6E7A8A';
const BODY = '#57636F';
const LABEL = '#93A0B0';

/** Zéro filet : uniquement des blocs gris très clair aux angles arrondis. */
function panel(content: string, options: { padding?: string; style?: string } = {}): string {
  const { padding = `${u(20)} ${u(24)}`, style = '' } = options;

  return `<div style="background:${PANEL}; border-radius:${u(22)}; padding:${padding}; ${style}">${content}</div>`;
}

function metaCell(label: string, value: string): string {
  return `<div>
    <div style="font-size:${u(9.5)}; letter-spacing:${u(
      1.1,
    )}; text-transform:uppercase; color:${LABEL}">${escapeHtml(label)}</div>
    <div style="font-size:${u(12)}; font-weight:700; margin-top:${u(3)}">${escapeHtml(value)}</div>
  </div>`;
}

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;

  return `<div class="dc-page" style="font-family:${FONTS.manrope}; color:${INK}; background:#fff; padding:${u(
    44,
  )} ${u(46)} ${u(38)}; gap:${u(14)}">
  ${panel(
    `<div style="display:flex; justify-content:space-between; align-items:center; gap:${u(20)}">
       <div style="display:flex; align-items:center; gap:${u(12)}">
         ${logoMark(context.logoUrl, issuer.initials, {
           size: 38,
           radius: 12,
           background: INK,
           color: '#fff',
           fontSize: 14,
           fontWeight: 800,
         })}
         <div>
           <div style="font-size:${u(17)}; font-weight:800">${escapeHtml(issuer.name)}</div>
           <div style="font-size:${u(10.5)}; color:${MUTED}; line-height:1.7; margin-top:${u(
             5,
           )}">${addressLines([
             issuer.addressLines.join(', '),
             [
               issuer.siret ? `SIRET ${issuer.siret}` : '',
               issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '',
             ]
               .filter(Boolean)
               .join(' · '),
           ])}</div>
         </div>
       </div>
       <div style="text-align:right">
         <div style="font-size:${u(22)}; font-weight:800; letter-spacing:${u(-0.6)}">${escapeHtml(
           labels.document,
         )}</div>
         <div style="font-size:${u(11)}; color:${MUTED}; margin-top:${u(4)}">${escapeHtml(
           context.number,
         )}</div>
       </div>
     </div>`,
    { padding: `${u(24)} ${u(26)}` },
  )}

  <div style="display:flex; gap:${u(14)}">
    <div style="flex:1.25">
      ${panel(
        `<div style="font-size:${u(9.5)}; letter-spacing:${u(
          1.3,
        )}; text-transform:uppercase; color:${LABEL}">Client</div>
         <div style="font-size:${u(13.5)}; font-weight:800; margin-top:${u(6)}">${escapeHtml(
           client.name,
         )}</div>
         <div style="font-size:${u(11)}; line-height:1.7; color:${BODY}; margin-top:${u(
           3,
         )}">${addressLines([
           [client.contactName, client.addressLines.join(', ')].filter(Boolean).join(' · '),
           client.vatNumber ? `TVA ${client.vatNumber}` : '',
         ])}</div>`,
      )}
    </div>
    <div style="flex:1">
      ${panel(
        `<div style="display:flex; flex-wrap:wrap; gap:${u(12)} ${u(10)}">${[
          ...context.meta.map((entry) => metaCell(entry.label, entry.value)),
        ]
          .map((cell) => `<div style="flex:1 1 45%; min-width:0">${cell}</div>`)
          .join('')}</div>`,
      )}
    </div>
  </div>

  ${LINES_ANCHOR}
  ${panel(
    `<div style="display:flex; gap:${u(10)}; font-size:${u(9.5)}; letter-spacing:${u(
      1.2,
    )}; text-transform:uppercase; color:${LABEL}; padding-bottom:${u(10)}">
       <div style="flex:1">${escapeHtml(labels.designation)}</div>
       <div style="width:${u(52)}; text-align:right">${escapeHtml(labels.quantity)}</div>
       <div style="width:${u(72)}; text-align:right">${escapeHtml(labels.unitPrice)}</div>
       <div style="width:${u(40)}; text-align:right">${escapeHtml(labels.vat)}</div>
       <div style="width:${u(84)}; text-align:right">${escapeHtml(labels.totalHt)}</div>
     </div>
     ${context.lines
       .map(
         (line) => `<div style="display:flex; gap:${u(10)}; padding:${u(9)} 0; font-size:${u(
           11.5,
         )}; align-items:baseline; font-variant-numeric:tabular-nums">
            <div style="flex:1; min-width:0"><span style="font-weight:700">${escapeHtml(
              line.title,
            )}</span>${
              line.description
                ? `<span style="color:#8494A4; font-size:${u(10.5)}"> — ${escapeMultiline(
                    line.description,
                  )}</span>`
                : ''
            }</div>
            <div style="width:${u(52)}; text-align:right; color:${BODY}">${escapeHtml(
              line.quantity,
            )}</div>
            <div style="width:${u(72)}; text-align:right; color:${BODY}">${escapeHtml(
              line.unitPrice,
            )}</div>
            <div style="width:${u(40)}; text-align:right; color:#8494A4">${escapeHtml(
              line.vatRate,
            )}</div>
            <div style="width:${u(84)}; text-align:right; font-weight:800">${escapeHtml(
              line.totalHt,
            )}</div>
          </div>`,
       )
       .join('')}`,
    { padding: `${u(18)} ${u(24)} ${u(22)}` },
  )}

  <div class="dc-keep" style="display:flex; gap:${u(14)}; align-items:stretch">
    <div style="flex:1">
      ${
        context.qrSvg || context.payment.iban
          ? panel(
              `<div style="display:flex; gap:${u(16)}; align-items:center">
                 ${qrSlot(context.qrSvg, 62)}
                 <div style="font-size:${u(10.5)}; line-height:1.8; color:${BODY}">
                   <span style="font-weight:800; color:${INK}">${escapeHtml(
                     context.payment.methods[0] ?? 'Virement bancaire',
                   )}</span><br/>
                   ${addressLines([
                     context.payment.iban ? `IBAN ${context.payment.iban}` : '',
                     context.payment.bic ? `BIC ${context.payment.bic}` : '',
                   ])}
                 </div>
               </div>`,
            )
          : ''
      }
    </div>
    <div style="width:${u(300)}; background:${INK}; color:#fff; border-radius:${u(22)}; padding:${u(
      20,
    )} ${u(24)}; font-variant-numeric:tabular-nums">
      ${[
        ...totals.rows,
        { label: 'Total TTC', value: totals.totalTtc },
        ...(totals.deposit ? [{ label: 'Acompte', value: totals.deposit }] : []),
      ]
        .map(
          (row) =>
            `<div style="display:flex; justify-content:space-between; font-size:${u(
              11,
            )}; padding:${u(3)} 0; color:rgba(255,255,255,.72)"><span>${escapeHtml(
              row.label,
            )}</span><span style="color:#fff">${escapeHtml(row.value)}</span></div>`,
        )
        .join('')}
      <div style="font-size:${u(10)}; letter-spacing:${u(
        1.2,
      )}; text-transform:uppercase; color:rgba(255,255,255,.6); margin-top:${u(
        12,
      )}">${escapeHtml(labels.amountDue)}</div>
      <div style="font-size:${u(26)}; font-weight:800; letter-spacing:${u(-0.8)}">${escapeHtml(
        totals.amountDue,
      )}</div>
    </div>
  </div>

  ${
    context.notes
      ? `<div style="font-size:${u(11)}; line-height:1.7; color:${BODY}">${escapeHtml(
          context.notes,
        )}</div>`
      : ''
  }

  <div class="dc-spacer"></div>

  ${legalBlock(context.legalMentions, { color: LABEL })}
</div>`;
}

export const template12: PdfTemplateDefinition = {
  id: '12',
  name: 'Soft Rounded',
  description: 'Aucun trait : uniquement des blocs gris très clair aux angles arrondis, bloc total inversé.',
  accent: INK,
  paper: '#FFFFFF',
  render,
};
