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

const BRONZE = '#8A7A55';
const INK = '#1E1B16';
const MUTED = '#6B6458';
const LABEL = '#9A9184';
const RULE = '#E6E1D6';

function sideLabel(text: string, marginTop = 0): string {
  return `<div style="font-size:${u(9.5)}; letter-spacing:${u(
    1.3,
  )}; text-transform:uppercase; color:${LABEL}; ${marginTop ? `margin-top:${u(marginTop)};` : ''}">${escapeHtml(
    text,
  )}</div>`;
}

/** Le numéro s'affiche sans son préfixe : « Facture n° 142 ». */
function shortNumber(value: string): string {
  const tail = value.split(/[-/\s]/).pop();
  return tail && /\d/.test(tail) ? tail.replace(/^0+(?=\d)/, '') : value;
}

function render(context: TemplateContext): string {
  const { issuer, client, totals, labels } = context;

  return `<div class="dc-page" style="font-family:${FONTS.sourceSerif}; color:${INK}; background:#FCFBF8; padding:${u(
    56,
  )} ${u(56)} ${u(44)}">
  <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:${u(
    2,
  )} solid ${INK}; padding-bottom:${u(18)}">
    <div>
      ${logoBanner(context.logoUrl, { maxHeight: 32, marginBottom: 8 })}
      <div style="font-size:${u(15)}; font-weight:600; letter-spacing:${u(0.4)}">${escapeHtml(
        issuer.name,
      )}</div>
    </div>
    ${
      issuer.addressLines.length > 0
        ? `<div style="font-family:${FONTS.plexMono}; font-size:${u(10.5)}; letter-spacing:${u(
            0.4,
          )}; color:${MUTED}">${escapeHtml(issuer.addressLines.slice(-1)[0] ?? '')}</div>`
        : ''
    }
  </div>

  <h2 style="font-size:${u(54)}; font-weight:400; letter-spacing:${u(-1.4)}; margin:${u(
    26,
  )} 0 0; line-height:1">${escapeHtml(labels.document)} <span style="font-style:italic; color:${BRONZE}">n° ${escapeHtml(
    shortNumber(context.number),
  )}</span></h2>

  <div style="display:flex; gap:${u(40)}; margin-top:${u(32)}; flex:1; align-items:stretch">
    <div style="width:${u(180)}; flex:none; font-family:${FONTS.plexSans}">
      ${sideLabel('Client')}
      <div style="font-size:${u(12)}; line-height:1.65; margin-top:${u(7)}">
        <strong>${escapeHtml(client.name)}</strong><br/>
        ${addressLines([client.contactName ?? '', ...client.addressLines, client.vatNumber ? `TVA ${client.vatNumber}` : ''])}
      </div>

      ${
        context.meta.length > 0
          ? `${sideLabel('Dates', 22)}
             <div style="font-size:${u(12)}; line-height:1.65; margin-top:${u(7)}">${addressLines(
               context.meta.map((entry) => `${entry.label} : ${entry.value}`),
             )}</div>`
          : ''
      }

      ${sideLabel(labels.issuer, 22)}
      <div style="font-size:${u(11)}; line-height:1.65; margin-top:${u(7)}; color:#4C463C">
        ${escapeHtml(
          [
            issuer.name,
            issuer.addressLines.join(', '),
            issuer.siret ? `SIRET ${issuer.siret}` : '',
            issuer.vatNumber ? `TVA ${issuer.vatNumber}` : '',
          ]
            .filter(Boolean)
            .join(' — '),
        )}
      </div>

      ${context.qrSvg ? `<div style="margin-top:${u(24)}">${qrSlot(context.qrSvg, 64)}</div>` : ''}
    </div>

    <div style="flex:1; display:flex; flex-direction:column; min-width:0">
      ${LINES_ANCHOR}
      ${context.lines
        .map(
          (line) => `<div style="display:flex; justify-content:space-between; gap:${u(
            18,
          )}; align-items:baseline; padding:${u(13)} 0; border-bottom:1px solid ${RULE}">
            <div style="flex:1; min-width:0">
              <div style="font-size:${u(14)}">${escapeHtml(line.title)}</div>
              <div style="font-family:${FONTS.plexSans}; font-size:${u(
                10,
              )}; color:#8C8477; margin-top:${u(3)}; line-height:1.5">${[
                line.description ? escapeMultiline(line.description) : '',
                escapeHtml(
                  `${line.quantity}${line.unit ? ` ${line.unit}` : ''} × ${line.unitPrice} · TVA ${line.vatRate}`,
                ),
              ]
                .filter(Boolean)
                .join(' · ')}</div>
            </div>
            <div style="font-family:${FONTS.plexMono}; font-size:${u(
              13,
            )}; white-space:nowrap">${escapeHtml(line.totalHt)}</div>
          </div>`,
        )
        .join('')}

      <div class="dc-spacer"></div>

      <div class="dc-keep" style="font-family:${FONTS.plexSans}; margin-top:${u(24)}">
        ${[
          ...totals.rows,
          { label: 'Total TTC', value: totals.totalTtc },
          ...(totals.deposit ? [{ label: 'Acompte versé', value: totals.deposit }] : []),
        ]
          .map(
            (row, index, all) =>
              `<div style="display:flex; justify-content:space-between; font-size:${u(
                11.5,
              )}; padding:${u(5)} 0; ${
                index === all.length - 1 ? `border-bottom:1px solid ${RULE};` : ''
              }"><span style="color:${MUTED}">${escapeHtml(row.label)}</span><span>${escapeHtml(
                row.value,
              )}</span></div>`,
          )
          .join('')}
        <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:${u(
          14,
        )}">
          <div style="font-family:${FONTS.sourceSerif}; font-size:${u(20)}">${escapeHtml(
            labels.amountDue,
          )}</div>
          <div style="font-family:${FONTS.sourceSerif}; font-size:${u(
            34,
          )}; font-weight:600; letter-spacing:${u(-1)}">${escapeHtml(totals.amountDue)}</div>
        </div>
      </div>
    </div>
  </div>

  ${
    context.payment.summary || context.legalMentions.length > 0 || context.notes
      ? `<div class="dc-keep" style="font-family:${FONTS.plexSans}; border-top:1px solid ${RULE}; padding-top:${u(
          14,
        )}; margin-top:${u(20)}">${legalBlock(
          [context.payment.summary ?? '', context.notes ?? '', ...context.legalMentions].filter(Boolean),
          { color: '#8C8477' },
        )}</div>`
      : ''
  }
</div>`;
}

export const template05: PdfTemplateDefinition = {
  id: '05',
  name: 'Editorial',
  description: 'Mise en page de magazine : titre serif large, colonne latérale d’informations.',
  accent: BRONZE,
  paper: '#FCFBF8',
  render,
};
