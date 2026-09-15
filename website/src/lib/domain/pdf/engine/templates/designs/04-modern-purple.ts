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
} from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';

const VIOLET = '#4F46E5';
const INK = '#191927';
const MUTED = '#77778C';
const LABEL = '#9A9AB0';
const BODY = '#5B5B72';
const CARD_BORDER = '#ECEAFB';

function card(content: string, options: { radius?: number; padding?: string; flex?: string } = {}): string {
  const { radius = 18, padding = `${u(18)} ${u(20)}`, flex = '' } = options;

  return `<div style="${flex ? `flex:${flex};` : ''} background:#fff; border:1px solid ${CARD_BORDER}; border-radius:${u(
    radius,
  )}; padding:${padding}">${content}</div>`;
}

function metaChip(label: string, value: string): string {
  return card(
    `<div style="font-size:${u(9.5)}; text-transform:uppercase; letter-spacing:${u(
      1,
    )}; color:${LABEL}">${escapeHtml(label)}</div>
     <div style="font-size:${u(12.5)}; font-weight:700; margin-top:${u(3)}">${escapeHtml(value)}</div>`,
    { radius: 14, padding: `${u(12)} ${u(16)}`, flex: '1' },
  );
}

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels, status } = context;
  const dueSuffix = context.secondaryDate ? ` avant le ${context.secondaryDate}` : '';

  return `<div class="dc-page" style="font-family:${FONTS.manrope}; color:${INK}; background:#FBFAFF; padding:${u(
    48,
  )} ${u(52)}">
  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:${u(24)}">
    <div style="display:flex; gap:${u(13)}; align-items:center">
      ${logoMark(context.logoUrl, issuer.initials, {
        size: 42,
        radius: 13,
        background: VIOLET,
        color: '#fff',
        fontSize: 15,
        fontWeight: 800,
      })}
      <div>
        <div style="font-size:${u(17)}; font-weight:800; letter-spacing:${u(-0.3)}">${escapeHtml(
          issuer.name,
        )}</div>
        ${
          issuer.addressLines.length > 0
            ? `<div style="font-size:${u(10.5)}; color:${MUTED}; margin-top:${u(2)}">${escapeHtml(
                issuer.addressLines.join(', '),
              )}</div>`
            : ''
        }
      </div>
    </div>
    <div style="text-align:right">
      ${
        status
          ? `<div style="display:inline-block; background:${status.background}; color:${
              status.color
            }; border-radius:${u(99)}; padding:${u(5)} ${u(12)}; font-size:${u(
              10,
            )}; font-weight:800; letter-spacing:${u(0.6)}; text-transform:uppercase">${escapeHtml(
              status.label,
            )}</div>`
          : ''
      }
      <div style="font-size:${u(24)}; font-weight:800; letter-spacing:${u(-0.8)}; margin-top:${u(
        12,
      )}">${escapeHtml(labels.document)}</div>
      <div style="font-size:${u(11.5)}; color:${MUTED}">${escapeHtml(context.number)}</div>
    </div>
  </div>

  <div style="display:flex; gap:${u(16)}; margin-top:${u(26)}">
    ${card(
      `<div style="font-size:${u(9.5)}; letter-spacing:${u(
        1.2,
      )}; text-transform:uppercase; color:${LABEL}">${escapeHtml(labels.billedTo)}</div>
       <div style="font-size:${u(14)}; font-weight:800; margin-top:${u(7)}">${escapeHtml(client.name)}</div>
       <div style="font-size:${u(11)}; line-height:1.7; color:${BODY}; margin-top:${u(4)}">${addressLines(
         [
           [client.contactName, ...client.addressLines].filter(Boolean).join(' — '),
           client.vatNumber ? `TVA ${client.vatNumber}` : '',
         ],
       )}</div>`,
      { flex: '1.3' },
    )}
    <div style="flex:1; background:${VIOLET}; border-radius:${u(18)}; padding:${u(18)} ${u(
      20,
    )}; color:#fff; display:flex; flex-direction:column; justify-content:center">
      <div style="font-size:${u(9.5)}; letter-spacing:${u(
        1.2,
      )}; text-transform:uppercase; color:rgba(255,255,255,.72)">${escapeHtml(
        `${labels.amountDue}${dueSuffix}`,
      )}</div>
      <div style="font-size:${u(30)}; font-weight:800; letter-spacing:${u(-1)}; margin-top:${u(
        6,
      )}">${escapeHtml(totals.amountDue)}</div>
    </div>
  </div>

  ${
    context.meta.length > 0
      ? `<div style="display:flex; gap:${u(10)}; margin-top:${u(16)}">${context.meta
          .map((entry) => metaChip(entry.label, entry.value))
          .join('')}</div>`
      : ''
  }

  <div style="background:#fff; border:1px solid ${CARD_BORDER}; border-radius:${u(18)}; padding:${u(
    8,
  )} ${u(20)} ${u(14)}; margin-top:${u(16)}">
    ${lineTable(context, {
      headBorder: 'none',
      headColor: LABEL,
      headSize: 9.5,
      headTracking: 1.1,
      rowBorder: '1px solid #F3F1FD',
      valueColor: BODY,
      descriptionColor: '#8B8BA0',
      rowPadding: 10,
    })}
  </div>

  <div class="dc-keep" style="display:flex; gap:${u(16)}; margin-top:${u(16)}; align-items:stretch">
    ${
      context.qrSvg || context.payment.iban
        ? card(
            `<div style="display:flex; gap:${u(16)}; align-items:center">
               ${qrSlot(context.qrSvg, 66)}
               <div>
                 <div style="font-size:${u(12)}; font-weight:800">Payer par virement</div>
                 <div style="font-size:${u(10.5)}; line-height:1.7; color:${BODY}; margin-top:${u(
                   4,
                 )}">${addressLines([
                   context.payment.iban ? `IBAN ${context.payment.iban}` : '',
                   context.payment.bic ? `BIC ${context.payment.bic}` : '',
                   context.payment.terms ?? '',
                 ])}</div>
               </div>
             </div>`,
            { flex: '1' },
          )
        : '<div style="flex:1"></div>'
    }
    <div style="width:${u(290)}; background:#fff; border:1px solid ${CARD_BORDER}; border-radius:${u(
      18,
    )}; padding:${u(16)} ${u(20)}; font-size:${u(11.5)}; font-variant-numeric:tabular-nums">
      ${[
        ...totals.rows,
        { label: 'Total TTC', value: totals.totalTtc },
        ...(totals.deposit ? [{ label: 'Acompte', value: totals.deposit }] : []),
      ]
        .map(
          (row) =>
            `<div style="display:flex; justify-content:space-between; padding:${u(
              4,
            )} 0"><span style="color:${MUTED}">${escapeHtml(
              row.label,
            )}</span><span style="font-weight:600">${escapeHtml(row.value)}</span></div>`,
        )
        .join('')}
      <div style="display:flex; justify-content:space-between; padding:${u(10)} 0 0; margin-top:${u(
        6,
      )}; border-top:1px solid ${CARD_BORDER}; font-size:${u(
        15,
      )}; font-weight:800"><span>${escapeHtml(
        labels.amountDue,
      )}</span><span style="color:${VIOLET}">${escapeHtml(totals.amountDue)}</span></div>
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

  ${legalBlock(
    [
      ...context.legalMentions,
      [issuer.siret ? `SIRET ${issuer.siret}` : '', issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '']
        .filter(Boolean)
        .join(' — '),
    ].filter(Boolean),
    { color: '#8B8BA0' },
  )}
</div>`;
}

export const template04: PdfTemplateDefinition = {
  id: '04',
  name: 'Modern Purple',
  description: 'Le modèle « maison » INVEQ : violet de marque, cartes arrondies, pastille de statut.',
  accent: VIOLET,
  paper: '#FBFAFF',
  render,
};
