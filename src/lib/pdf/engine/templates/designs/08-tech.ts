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

const TEAL = '#0E8F82';
const INK = '#0F1A1C';
const MUTED = '#6B7B7E';
const LABEL = '#8FA1A3';

/** Le modèle affiche les informations en clé=valeur, façon fichier de configuration. */
function pair(key: string, value: string): string {
  return `${escapeHtml(key)}=${escapeHtml(value)}`;
}

function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase();
}

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;

  return `<div class="dc-page" style="font-family:${FONTS.plexMono}; color:${INK}; background:#fff; padding:${u(
    48,
  )} ${u(52)} ${u(40)}">
  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:${u(24)}">
    <div>
      <div style="display:flex; align-items:center; gap:${u(9)}">
        <div style="width:${u(9)}; height:${u(9)}; background:${TEAL}"></div>
        <div style="font-size:${u(15)}; font-weight:500; letter-spacing:${u(1)}">${escapeHtml(
          slug(issuer.name),
        )}</div>
      </div>
      ${logoBanner(context.logoUrl, { maxHeight: 30, marginBottom: 10 })}
      <div style="font-size:${u(10)}; line-height:1.8; color:${MUTED}; margin-top:${u(12)}">
        ${addressLines([
          // Le slug de l'en-tête est décoratif : la raison sociale exacte doit figurer.
          issuer.name,
          issuer.addressLines.join(', '),
          issuer.siret ? pair('siret', issuer.siret) : '',
          issuer.vatNumber ? pair('tva', issuer.vatNumber) : '',
        ])}
      </div>
    </div>
    <div style="text-align:right; font-size:${u(10)}; line-height:1.9; color:${MUTED}">
      <div style="font-size:${u(13)}; color:${INK}; letter-spacing:${u(1)}">${escapeHtml(
        context.kind === 'quote' ? 'quote' : 'invoice',
      )}/${escapeHtml(context.number)}</div>
      ${context.meta
        .map((entry) => `<div>${escapeHtml(`${slug(entry.label).toLowerCase()}=${entry.value}`)}</div>`)
        .join('')}
    </div>
  </div>

  <div style="background:#F3F7F7; border-left:${u(3)} solid ${TEAL}; padding:${u(14)} ${u(
    18,
  )}; margin-top:${u(24)}; display:flex; justify-content:space-between; align-items:center; gap:${u(20)}">
    <div style="font-size:${u(10)}; color:${MUTED}; line-height:1.8">
      bill_to = ${escapeHtml([client.name, client.contactName].filter(Boolean).join(' / '))}<br/>
      ${addressLines([
        client.addressLines.join(' — '),
        client.vatNumber ? `TVA ${client.vatNumber}` : '',
      ])}
    </div>
    <div style="text-align:right; flex-shrink:0">
      <div style="font-size:${u(9)}; color:${MUTED}">amount_due</div>
      <div style="font-size:${u(24)}; font-weight:500; letter-spacing:${u(-0.5)}">${escapeHtml(
        totals.amountDue,
      )}</div>
    </div>
  </div>

  <div style="margin-top:${u(26)}">
    ${lineTable(context, {
      headBorder: `1px dashed #C9D6D7`,
      headColor: LABEL,
      headSize: 9.5,
      headTracking: 1.2,
      rowBorder: '1px dashed #E4EBEC',
      fontSize: 11,
      descriptionSize: 9.5,
      descriptionColor: LABEL,
      valueColor: INK,
      rowPadding: 10,
    })}
  </div>

  <div class="dc-keep" style="display:flex; gap:${u(20)}; margin-top:${u(24)}; align-items:flex-start">
    <div style="flex:1; font-size:${u(10)}; line-height:1.9; color:${MUTED}">
      <div style="color:${INK}; font-size:${u(9.5)}; letter-spacing:${u(
        1.2,
      )}; text-transform:uppercase">payment</div>
      ${addressLines([
        context.payment.iban ? pair('iban', context.payment.iban) : '',
        context.payment.bic ? pair('bic', context.payment.bic) : '',
        context.payment.terms ? pair('terms', context.payment.terms) : '',
      ])}
    </div>
    ${qrSlot(context.qrSvg, 62)}
    <div style="width:${u(280)}; font-size:${u(11)}; font-variant-numeric:tabular-nums">
      ${[...totals.rows, { label: 'total_ttc', value: totals.totalTtc }]
        .map(
          (row, index, all) =>
            `<div style="display:flex; justify-content:space-between; padding:${u(
              index === all.length - 1 ? 8 : 4,
            )} 0; ${
              index === all.length - 1 ? 'border-top:1px solid #D8E3E4;' : ''
            }"><span style="color:${MUTED}">${escapeHtml(row.label)}</span><span>${escapeHtml(
              row.value,
            )}</span></div>`,
        )
        .join('')}
      ${
        totals.deposit
          ? `<div style="display:flex; justify-content:space-between; padding:${u(
              4,
            )} 0"><span style="color:${MUTED}">deposit</span><span>${escapeHtml(
              totals.deposit,
            )}</span></div>`
          : ''
      }
      <div style="display:flex; justify-content:space-between; padding:${u(10)} ${u(
        12,
      )}; margin-top:${u(8)}; background:${INK}; color:#fff; font-size:${u(
        13,
      )}"><span>${escapeHtml(slug(labels.amountDue).toLowerCase())}</span><span>${escapeHtml(
        totals.amountDue,
      )}</span></div>
    </div>
  </div>

  <div class="dc-spacer"></div>

  ${
    context.legalMentions.length > 0 || context.notes
      ? `<div class="dc-keep" style="border-top:1px dashed #C9D6D7; padding-top:${u(14)}">${legalBlock(
          [context.notes ?? '', ...context.legalMentions].filter(Boolean),
          { color: LABEL, size: 9, lineHeight: 1.85 },
        )}</div>`
      : ''
  }
</div>`;
}

export const template08: PdfTemplateDefinition = {
  id: '08',
  name: 'Tech',
  description: 'Monospace intégral, libellés en clé/valeur, séparateurs pointillés, accent teal.',
  accent: TEAL,
  paper: '#FFFFFF',
  render,
};
