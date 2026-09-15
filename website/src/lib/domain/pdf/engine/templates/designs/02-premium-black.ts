import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import {
  FONTS,
  addressLines,
  escapeHtml,
  legalBlock,
  logoBanner,
  lineTable,
  qrSlot,
  sectionLabel,
  u,
} from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';

const BLACK = '#101014';
const INK = '#14141A';
const MUTED = '#6C6C78';
const LABEL = '#9A9AA6';
const ON_BLACK = 'rgba(255,255,255,.55)';

function bandLabel(text: string): string {
  return `<div style="font-size:${u(10)}; letter-spacing:${u(
    2.4,
  )}; text-transform:uppercase; color:${ON_BLACK}">${escapeHtml(text)}</div>`;
}

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;
  const dueSuffix = context.secondaryDate ? ` avant le ${context.secondaryDate}` : '';

  return `<div class="dc-page" style="font-family:${FONTS.archivo}; color:${INK}; background:#fff">
  <div style="background:${BLACK}; color:#fff; padding:${u(34)} ${u(56)} ${u(32)}">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:${u(24)}">
      <div>
        ${logoBanner(context.logoUrl, { maxHeight: 34, marginBottom: 10 })}
        <div style="font-size:${u(20)}; font-weight:800; letter-spacing:${u(
          3,
        )}; text-transform:uppercase">${escapeHtml(issuer.name)}</div>
        ${
          issuer.email || issuer.phone
            ? `<div style="font-size:${u(10)}; letter-spacing:${u(2.4)}; text-transform:uppercase; color:${ON_BLACK}; margin-top:${u(
                6,
              )}">${escapeHtml([issuer.email, issuer.phone].filter(Boolean).join(' · '))}</div>`
            : ''
        }
      </div>
      <div style="text-align:right">
        ${bandLabel(labels.document)}
        <div style="font-family:${FONTS.plexMono}; font-size:${u(16)}; margin-top:${u(6)}">${escapeHtml(
          context.number,
        )}</div>
      </div>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:${u(24)}; margin-top:${u(
      32,
    )}">
      <div>
        ${bandLabel(`${labels.amountDue}${dueSuffix}`)}
        <div style="font-size:${u(48)}; font-weight:800; letter-spacing:${u(-1.6)}; margin-top:${u(
          6,
        )}">${escapeHtml(totals.amountDue)}</div>
      </div>
      ${qrSlot(context.qrSvg, 72)}
    </div>
  </div>

  <div style="padding:${u(30)} ${u(56)} ${u(34)}; display:flex; flex-direction:column; flex:1">
    <div style="display:flex; gap:${u(34)}; padding-bottom:${u(26)}; border-bottom:${u(2)} solid ${BLACK}">
      <div style="flex:1">
        ${sectionLabel(labels.issuer, { color: LABEL, tracking: 1.8 })}
        <div style="font-size:${u(11)}; line-height:1.7; margin-top:${u(8)}">
          ${addressLines([
            issuer.name,
            ...issuer.addressLines,
            issuer.siret ? `SIRET ${issuer.siret}` : '',
            issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '',
          ])}
        </div>
      </div>
      <div style="flex:1">
        ${sectionLabel('Client', { color: LABEL, tracking: 1.8 })}
        <div style="font-size:${u(11)}; line-height:1.7; margin-top:${u(8)}">
          <strong>${escapeHtml(client.name)}</strong><br/>
          ${addressLines([
            client.contactName ?? '',
            ...client.addressLines,
            client.vatNumber ? `TVA ${client.vatNumber}` : '',
          ])}
        </div>
      </div>
      <div style="flex:1">
        ${sectionLabel('Dates', { color: LABEL, tracking: 1.8 })}
        <div style="font-size:${u(11)}; line-height:1.7; margin-top:${u(8)}">
          ${addressLines(context.meta.map((entry) => `${entry.label} : ${entry.value}`))}
        </div>
      </div>
    </div>

    <div style="margin-top:${u(24)}">
      ${lineTable(context, {
        headBorder: 'none',
        rowBorder: '1px solid #E8E8EE',
        headColor: LABEL,
        headTracking: 1.6,
        valueColor: INK,
        rowPadding: 10,
      })}
    </div>

    <div class="dc-keep" style="display:flex; justify-content:space-between; gap:${u(40)}; margin-top:${u(
      26,
    )}; align-items:flex-start">
      <div style="max-width:${u(300)}">
        ${
          context.payment.iban
            ? `${sectionLabel('Coordonnées bancaires', { color: LABEL, tracking: 1.8 })}
               <div style="font-family:${FONTS.plexMono}; font-size:${u(10.5)}; line-height:1.8; margin-top:${u(
                 8,
               )}">${addressLines([context.payment.iban, context.payment.bic ?? ''])}</div>`
            : ''
        }
      </div>
      <div style="width:${u(300)}; background:#F4F4F7; padding:${u(18)} ${u(20)}; font-size:${u(
        11.5,
      )}; font-variant-numeric:tabular-nums">
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
          9,
        )} 0; border-top:1px solid #DADAE2; font-weight:700"><span>Total TTC</span><span>${escapeHtml(
          totals.totalTtc,
        )}</span></div>
        ${
          totals.deposit
            ? `<div style="display:flex; justify-content:space-between; padding:${u(
                5,
              )} 0"><span style="color:${MUTED}">Acompte</span><span>${escapeHtml(totals.deposit)}</span></div>`
            : ''
        }
        <div style="display:flex; justify-content:space-between; padding:${u(10)} 0 0; margin-top:${u(
          6,
        )}; border-top:${u(2)} solid ${BLACK}; font-weight:800; font-size:${u(15)}"><span>${escapeHtml(
          labels.amountDue,
        )}</span><span>${escapeHtml(totals.amountDue)}</span></div>
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

    ${
      context.legalMentions.length > 0
        ? `<div class="dc-keep" style="border-top:1px solid #E8E8EE; padding-top:${u(16)}">${legalBlock(
            context.legalMentions,
          )}</div>`
        : ''
    }
  </div>
</div>`;
}

export const template02: PdfTemplateDefinition = {
  id: '02',
  name: 'Premium Black',
  description: 'Bandeau noir pleine largeur, montant dû en très grand, typographie Archivo.',
  accent: '#101014',
  paper: '#FFFFFF',
  render,
};
