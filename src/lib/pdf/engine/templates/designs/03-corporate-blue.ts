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

const NAVY = '#123A6B';
const INK = '#17202E';
const MUTED = '#5B6779';
const SOFT = '#7A869A';
const BORDER = '#DCE3ED';
const PANEL = '#F2F5FA';

function partyCard(title: string, body: string): string {
  return `<div style="background:${PANEL}; padding:${u(18)} ${u(20)}">
    <div style="font-size:${u(10)}; letter-spacing:${u(
      1.2,
    )}; text-transform:uppercase; color:${NAVY}; font-weight:600">${escapeHtml(title)}</div>
    <div style="font-size:${u(11.5)}; line-height:1.75; margin-top:${u(8)}">${body}</div>
  </div>`;
}

function metaCell(label: string, value: string, highlighted = false): string {
  return `<div style="flex:1; background:${highlighted ? NAVY : '#fff'}; padding:${u(12)} ${u(14)}">
    <div style="font-size:${u(9.5)}; text-transform:uppercase; letter-spacing:${u(1)}; color:${
      highlighted ? 'rgba(255,255,255,.7)' : MUTED
    }">${escapeHtml(label)}</div>
    <div style="font-size:${u(12.5)}; font-weight:600; margin-top:${u(4)}; ${
      highlighted ? 'color:#fff;' : ''
    }">${escapeHtml(value)}</div>
  </div>`;
}

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;

  const metaCells = [
    ...context.meta.map((entry) => metaCell(entry.label, entry.value)),
    metaCell(labels.amountDue, totals.amountDue, true),
  ];

  return `<div class="dc-page" style="font-family:${FONTS.plexSans}; color:${INK}; background:#fff">
  <div style="height:${u(8)}; background:${NAVY}"></div>

  <div style="padding:${u(32)} ${u(56)} 0; display:flex; justify-content:space-between; align-items:flex-start; gap:${u(
    24,
  )}">
    <div style="display:flex; gap:${u(14)}; align-items:center">
      ${logoMark(context.logoUrl, issuer.initials, {
        size: 44,
        background: NAVY,
        color: '#fff',
        fontSize: 16,
        fontWeight: 600,
      })}
      <div>
        <div style="font-size:${u(18)}; font-weight:600">${escapeHtml(issuer.name)}</div>
        ${
          issuer.addressLines.length > 0
            ? `<div style="font-size:${u(11)}; color:${MUTED}">${escapeHtml(
                issuer.addressLines.join(' — '),
              )}</div>`
            : ''
        }
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:${u(26)}; font-weight:600; color:${NAVY}; letter-spacing:${u(
        -0.4,
      )}; text-transform:uppercase">${escapeHtml(labels.document)}</div>
      <div style="font-size:${u(12)}; color:${MUTED}; margin-top:${u(4)}">N° ${escapeHtml(
        context.number,
      )}</div>
    </div>
  </div>

  <div style="padding:${u(30)} ${u(56)} 0; display:flex; gap:${u(22)}">
    <div style="flex:1">
      ${partyCard(
        labels.issuer,
        addressLines([
          issuer.name,
          ...issuer.addressLines,
          [issuer.siret ? `SIRET ${issuer.siret}` : '', issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '']
            .filter(Boolean)
            .join(' — '),
          [issuer.email, issuer.phone].filter(Boolean).join(' — '),
        ]),
      )}
    </div>
    <div style="flex:1">
      ${partyCard(
        'Client',
        `<strong>${escapeHtml(client.name)}</strong><br/>${addressLines([
          [client.contactName, client.addressLines[0]].filter(Boolean).join(' — '),
          ...client.addressLines.slice(1),
          client.vatNumber ? `TVA ${client.vatNumber}` : '',
        ])}`,
      )}
    </div>
  </div>

  <div style="display:flex; gap:1px; background:${BORDER}; border:1px solid ${BORDER}; margin:${u(
    22,
  )} ${u(56)} 0">
    ${metaCells.join('')}
  </div>

  <div style="padding:${u(26)} ${u(56)} 0">
    ${lineTable(context, {
      headBackground: NAVY,
      headColor: '#fff',
      headBorder: 'none',
      headSize: 10,
      headTracking: 0.8,
      rowBorder: '1px solid #EAEEF4',
      valueColor: INK,
      descriptionColor: SOFT,
      rowPadding: 9,
    })}
  </div>

  <div class="dc-keep" style="padding:${u(22)} ${u(56)} 0; display:flex; gap:${u(
    24,
  )}; align-items:flex-start">
    <div style="flex:1; border:1px solid ${BORDER}; padding:${u(16)} ${u(18)}">
      <div style="font-size:${u(10)}; letter-spacing:${u(
        1.2,
      )}; text-transform:uppercase; color:${NAVY}; font-weight:600">Conditions de paiement</div>
      <div style="font-size:${u(11)}; line-height:1.75; margin-top:${u(8)}; color:#3C4859">
        ${addressLines([
          context.payment.terms ?? '',
          ...context.payment.methods,
          context.payment.iban ? `IBAN ${context.payment.iban}` : '',
          context.payment.bic ? `BIC ${context.payment.bic}` : '',
        ])}
      </div>
    </div>
    <div style="width:${u(288)}; font-variant-numeric:tabular-nums">
      ${totals.rows
        .map(
          (row) =>
            `<div style="display:flex; justify-content:space-between; padding:${u(6)} 0; font-size:${u(
              11.5,
            )}"><span style="color:${MUTED}">${escapeHtml(row.label)}</span><span>${escapeHtml(
              row.value,
            )}</span></div>`,
        )
        .join('')}
      <div style="display:flex; justify-content:space-between; padding:${u(9)} 0; font-size:${u(
        12.5,
      )}; font-weight:600; border-top:1px solid ${BORDER}"><span>Total TTC</span><span>${escapeHtml(
        totals.totalTtc,
      )}</span></div>
      ${
        totals.deposit
          ? `<div style="display:flex; justify-content:space-between; padding:${u(6)} 0; font-size:${u(
              11.5,
            )}"><span style="color:${MUTED}">Acompte versé</span><span>${escapeHtml(
              totals.deposit,
            )}</span></div>`
          : ''
      }
      <div style="display:flex; justify-content:space-between; padding:${u(11)} ${u(
        14,
      )}; margin-top:${u(8)}; background:${NAVY}; color:#fff; font-size:${u(
        14,
      )}; font-weight:600"><span>${escapeHtml(labels.amountDue)}</span><span>${escapeHtml(
        totals.amountDue,
      )}</span></div>
    </div>
  </div>

  ${
    context.notes
      ? `<div style="padding:${u(18)} ${u(56)} 0; font-size:${u(
          11,
        )}; line-height:1.7; color:${MUTED}">${escapeHtml(context.notes)}</div>`
      : ''
  }

  <div class="dc-spacer"></div>

  <div class="dc-keep" style="padding:0 ${u(56)} ${u(30)}; display:flex; align-items:flex-end; gap:${u(
    24,
  )}">
    <div style="flex:1; border-top:1px solid #EAEEF4; padding-top:${u(14)}">
      ${legalBlock(context.legalMentions, { color: SOFT })}
    </div>
    ${qrSlot(context.qrSvg, 58)}
  </div>
</div>`;
}

export const template03: PdfTemplateDefinition = {
  id: '03',
  name: 'Corporate Blue',
  description: 'Classique d’entreprise : en-tête bleu marine, cartouche de dates, tableau à en-tête plein.',
  accent: NAVY,
  paper: '#FFFFFF',
  render,
};
