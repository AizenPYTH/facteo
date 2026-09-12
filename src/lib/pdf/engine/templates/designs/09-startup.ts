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

const GREEN = '#0B7A4B';
const INK = '#11231C';
const MUTED = '#5E7169';
const LABEL = '#8A9B94';

function shortNumber(value: string): string {
  const tail = value.split(/[-/\s]/).pop();
  return tail && /\d/.test(tail) ? tail : value;
}

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;

  return `<div class="dc-page" style="font-family:${FONTS.grotesk}; color:${INK}; background:#fff; padding:${u(
    46,
  )} ${u(50)} ${u(40)}">
  <div style="display:flex; gap:${u(20)}; align-items:stretch">
    <div style="flex:1; min-width:0">
      <div style="display:flex; align-items:center; gap:${u(11)}">
        ${logoMark(context.logoUrl, issuer.initials, {
          size: 34,
          radius: 10,
          background: GREEN,
          color: '#fff',
          fontSize: 14,
        })}
        <div style="font-size:${u(18)}; font-weight:700; letter-spacing:${u(-0.4)}">${escapeHtml(
          issuer.name,
        )}</div>
      </div>
      <div style="font-size:${u(34)}; font-weight:700; letter-spacing:${u(-1.4)}; margin-top:${u(
        26,
      )}">${escapeHtml(labels.document)} ${escapeHtml(shortNumber(context.number))}</div>
      ${
        context.meta.length > 0
          ? `<div style="font-size:${u(12)}; color:${MUTED}; margin-top:${u(6)}">${escapeHtml(
              context.meta.map((entry) => `${entry.label} ${entry.value}`).join(' · '),
            )}</div>`
          : ''
      }
    </div>
    <div style="width:${u(250)}; background:${GREEN}; color:#fff; border-radius:${u(16)}; padding:${u(
      20,
    )}; display:flex; flex-direction:column; justify-content:center">
      <div style="font-size:${u(10)}; letter-spacing:${u(
        1.4,
      )}; text-transform:uppercase; color:rgba(255,255,255,.72)">${escapeHtml(
        context.secondaryDate ? `À régler avant le ${context.secondaryDate}` : labels.amountDue,
      )}</div>
      <div style="font-size:${u(32)}; font-weight:700; letter-spacing:${u(-1.2)}; margin-top:${u(
        6,
      )}">${escapeHtml(totals.amountDue)}</div>
      ${
        totals.deposit
          ? `<div style="font-size:${u(10.5)}; color:rgba(255,255,255,.78); margin-top:${u(
              6,
            )}">Acompte de ${escapeHtml(totals.deposit.replace('− ', ''))} déjà reçu</div>`
          : ''
      }
    </div>
  </div>

  <div style="display:flex; gap:${u(20)}; margin-top:${u(30)}; font-size:${u(11.5)}; line-height:1.75">
    <div style="flex:1; min-width:0">
      <div style="font-size:${u(9.5)}; letter-spacing:${u(
        1.4,
      )}; text-transform:uppercase; color:${LABEL}">De</div>
      <div style="margin-top:${u(7)}">${addressLines([
        [issuer.name, issuer.addressLines.join(', ')].filter(Boolean).join(' — '),
        [issuer.siret ? `SIRET ${issuer.siret}` : '', issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '']
          .filter(Boolean)
          .join(' — '),
        issuer.email ?? '',
      ])}</div>
    </div>
    <div style="flex:1; min-width:0">
      <div style="font-size:${u(9.5)}; letter-spacing:${u(
        1.4,
      )}; text-transform:uppercase; color:${LABEL}">Pour</div>
      <div style="margin-top:${u(7)}"><strong>${escapeHtml(client.name)}</strong>${
        client.contactName ? ` — ${escapeHtml(client.contactName)}` : ''
      }<br/>${addressLines([
        client.addressLines.join(', '),
        client.vatNumber ? `TVA ${client.vatNumber}` : '',
      ])}</div>
    </div>
  </div>

  <div style="margin-top:${u(28)}; border:${u(1.5)} solid ${INK}; border-radius:${u(
    16,
  )}; overflow:hidden">
    <div style="padding:0 ${u(18)}">
      ${lineTable(
        { ...context, labels: { ...context.labels, designation: 'Ce qui a été fait' } },
        {
          headBackground: 'transparent',
          headBorder: 'none',
          headColor: LABEL,
          headSize: 9.5,
          headTracking: 1.2,
          rowBorder: '1px solid #E6EDEA',
          valueColor: INK,
          descriptionColor: '#7E908A',
          rowPadding: 10,
        },
      )}
    </div>
    <div class="dc-keep" style="border-top:${u(1.5)} solid ${INK}; background:#F3F8F5; padding:${u(
      14,
    )} ${u(18)}; display:flex; justify-content:space-between; gap:${u(20)}; font-size:${u(11.5)}">
      <div style="color:${MUTED}; line-height:1.8">${escapeHtml(
        totals.rows.map((row) => `${row.label} ${row.value}`).join(' · '),
      )}</div>
      <div style="text-align:right; line-height:1.8; flex-shrink:0">
        <div style="color:${MUTED}">Total TTC</div>
        <div style="font-size:${u(17)}; font-weight:700">${escapeHtml(totals.totalTtc)}</div>
      </div>
    </div>
  </div>

  ${
    context.qrSvg || context.payment.iban
      ? `<div class="dc-keep" style="display:flex; gap:${u(16)}; margin-top:${u(
          22,
        )}; align-items:center; background:#F3F8F5; border-radius:${u(16)}; padding:${u(16)} ${u(
          18,
        )}">
           ${qrSlot(context.qrSvg, 64)}
           <div style="flex:1; min-width:0">
             <div style="font-size:${u(12.5)}; font-weight:700">${escapeHtml(
               context.qrSvg ? 'Scannez pour payer en un virement' : 'Coordonnées bancaires',
             )}</div>
             <div style="font-size:${u(10.5)}; color:${MUTED}; line-height:1.7; margin-top:${u(
               3,
             )}">${escapeHtml(
               [
                 context.payment.iban ? `IBAN ${context.payment.iban}` : '',
                 context.payment.bic ? `BIC ${context.payment.bic}` : '',
                 context.payment.terms ?? '',
               ]
                 .filter(Boolean)
                 .join(' · '),
             )}</div>
           </div>
         </div>`
      : ''
  }

  ${
    context.notes
      ? `<div style="margin-top:${u(18)}; font-size:${u(
          11,
        )}; line-height:1.7; color:${MUTED}">${escapeHtml(context.notes)}</div>`
      : ''
  }

  <div class="dc-spacer"></div>

  ${legalBlock(context.legalMentions, { color: LABEL })}
</div>`;
}

export const template09: PdfTemplateDefinition = {
  id: '09',
  name: 'Startup',
  description: 'Ton direct, vert émeraude, montant dû en bloc plein et tableau encadré.',
  accent: GREEN,
  paper: '#FFFFFF',
  render,
};
