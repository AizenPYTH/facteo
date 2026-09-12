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

const SLATE = '#2A3340';
const INK = '#1B2027';
const MUTED = '#5A6472';
const LABEL = '#94A0AE';
const PANEL = '#F3F5F8';

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;

  return `<div class="dc-page" style="font-family:${FONTS.jakarta}; color:${INK}; background:#fff">
  <div style="background:${SLATE}; color:#fff; padding:${u(34)} ${u(
    44,
  )}; display:flex; justify-content:space-between; align-items:center; gap:${u(20)}">
    <div style="min-width:0">
      ${logoBanner(context.logoUrl, { maxHeight: 32, marginBottom: 8 })}
      <div style="font-size:${u(19)}; font-weight:800; letter-spacing:${u(-0.3)}">${escapeHtml(
        issuer.name,
      )}</div>
      <div style="font-size:${u(10.5)}; color:rgba(255,255,255,.62); margin-top:${u(
        4,
      )}">${escapeHtml(
        [
          issuer.addressLines.join(', '),
          issuer.siret ? `SIRET ${issuer.siret}` : '',
          issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '',
        ]
          .filter(Boolean)
          .join(' · '),
      )}</div>
    </div>
    <div style="text-align:right; flex-shrink:0">
      <div style="font-size:${u(10)}; letter-spacing:${u(
        2,
      )}; text-transform:uppercase; color:rgba(255,255,255,.62)">${escapeHtml(labels.document)}</div>
      <div style="font-size:${u(16)}; font-weight:700; margin-top:${u(3)}">${escapeHtml(
        context.number,
      )}</div>
    </div>
  </div>

  <div style="display:flex; flex:1; min-height:0">
    <div style="flex:1; min-width:0; padding:${u(28)} ${u(26)} ${u(28)} ${u(
      44,
    )}; display:flex; flex-direction:column">
      <div style="display:flex; gap:${u(26)}">
        <div style="flex:1; min-width:0">
          <div style="font-size:${u(9.5)}; letter-spacing:${u(
            1.3,
          )}; text-transform:uppercase; color:${LABEL}">${escapeHtml(labels.billedTo)}</div>
          <div style="font-size:${u(13)}; font-weight:800; margin-top:${u(6)}">${escapeHtml(
            client.name,
          )}</div>
          <div style="font-size:${u(10.5)}; line-height:1.7; color:${MUTED}; margin-top:${u(
            3,
          )}">${addressLines([
            client.contactName ?? '',
            ...client.addressLines,
            client.vatNumber ? `TVA ${client.vatNumber}` : '',
          ])}</div>
        </div>
        ${
          context.meta.length > 0
            ? `<div style="width:${u(150)}; flex-shrink:0">
                 <div style="font-size:${u(9.5)}; letter-spacing:${u(
                   1.3,
                 )}; text-transform:uppercase; color:${LABEL}">Repères</div>
                 <div style="font-size:${u(10.5)}; line-height:1.8; margin-top:${u(
                   6,
                 )}">${addressLines(
                   context.meta.map((entry) => `${entry.label} ${entry.value}`),
                 )}</div>
               </div>`
            : ''
        }
      </div>

      <div style="margin-top:${u(24)}">
        ${lineTable(context, {
          headBorder: 'none',
          headColor: LABEL,
          headSize: 9,
          headTracking: 1.1,
          rowBorder: 'none',
          stripe: PANEL,
          fontSize: 11,
          descriptionSize: 9.5,
          descriptionColor: '#7C8899',
          valueColor: INK,
          labelColor: INK,
          rowPadding: 9,
        })}
      </div>

      ${
        context.notes
          ? `<div style="margin-top:${u(16)}; font-size:${u(
              10.5,
            )}; line-height:1.7; color:${MUTED}">${escapeHtml(context.notes)}</div>`
          : ''
      }

      <div class="dc-spacer"></div>

      ${
        context.legalMentions.length > 0
          ? `<div class="dc-keep" style="border-top:1px solid #E8ECF1; padding-top:${u(
              12,
            )}">${legalBlock(context.legalMentions, { color: LABEL, size: 9 })}</div>`
          : ''
      }
    </div>

    <div style="width:${u(236)}; flex-shrink:0; background:${PANEL}; padding:${u(28)} ${u(
      26,
    )} ${u(28)} ${u(22)}; display:flex; flex-direction:column">
      <div style="font-size:${u(9.5)}; letter-spacing:${u(
        1.3,
      )}; text-transform:uppercase; color:${LABEL}">Synthèse</div>
      <div style="font-size:${u(11)}; margin-top:${u(10)}; font-variant-numeric:tabular-nums">
        ${totals.rows
          .map(
            (row, index, all) =>
              `<div style="display:flex; justify-content:space-between; padding:${u(4)} 0; ${
                index === all.length - 1 ? 'border-bottom:1px solid #DDE3EB;' : ''
              }"><span style="color:${MUTED}">${escapeHtml(row.label)}</span><span>${escapeHtml(
                row.value,
              )}</span></div>`,
          )
          .join('')}
        <div style="display:flex; justify-content:space-between; padding:${u(
          8,
        )} 0; font-weight:700"><span>Total TTC</span><span>${escapeHtml(totals.totalTtc)}</span></div>
        ${
          totals.deposit
            ? `<div style="display:flex; justify-content:space-between; padding:${u(
                4,
              )} 0"><span style="color:${MUTED}">Acompte</span><span>${escapeHtml(
                totals.deposit,
              )}</span></div>`
            : ''
        }
      </div>

      <div style="background:${SLATE}; color:#fff; padding:${u(14)} ${u(16)}; margin-top:${u(14)}">
        <div style="font-size:${u(9.5)}; letter-spacing:${u(
          1.2,
        )}; text-transform:uppercase; color:rgba(255,255,255,.62)">${escapeHtml(
          labels.amountDue,
        )}</div>
        <div style="font-size:${u(22)}; font-weight:800; letter-spacing:${u(
          -0.6,
        )}; margin-top:${u(3)}">${escapeHtml(totals.amountDue)}</div>
      </div>

      <div class="dc-spacer"></div>

      ${qrSlot(context.qrSvg, 74)}
      ${
        context.payment.iban
          ? `<div style="font-size:${u(9.5)}; line-height:1.65; color:${MUTED}; margin-top:${u(
              10,
            )}">${addressLines([
              `IBAN ${context.payment.iban}`,
              context.payment.bic ? `BIC ${context.payment.bic}` : '',
            ])}</div>`
          : ''
      }
    </div>
  </div>
</div>`;
}

export const template17: PdfTemplateDefinition = {
  id: '17',
  name: 'Dark Header',
  description: 'Bandeau ardoise, lignes zébrées et colonne de synthèse sur la droite.',
  accent: SLATE,
  paper: '#FFFFFF',
  render,
};
