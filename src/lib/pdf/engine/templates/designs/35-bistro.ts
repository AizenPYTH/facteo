import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, legalIdsText, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const INK = '#3A2A1E';
const MUTED = '#8A7462';
const WINE = '#7A2E2A';
const CREAM = '#F7EFDD';

/** Filet double encadrant un fleuron central. */
function ornament(glyph = '❦'): string {
  return `<div style="display:flex; align-items:center; gap:${u(12)}; margin:${u(16)} auto; width:${u(420)}">
    <span style="flex:1; height:${u(5)}; border-top:${u(1)} solid ${INK}; border-bottom:${u(1)} solid ${INK}"></span>
    <span style="font-size:${u(16)}; color:${WINE}; line-height:1">${glyph}</span>
    <span style="flex:1; height:${u(5)}; border-top:${u(1)} solid ${INK}; border-bottom:${u(1)} solid ${INK}"></span>
  </div>`;
}

/** Libellé ……… valeur, comme sur une carte de restaurant. */
function leader(left: string, right: string, style = ''): string {
  return `<div style="display:flex; align-items:baseline; gap:${u(6)}; ${style}"><span>${left}</span><span style="flex:1; border-bottom:${u(1.5)} dotted ${MUTED}; transform:translateY(-${u(4)})"></span><span style="white-space:nowrap">${right}</span></div>`;
}

/** Addition de bistrot : tout centré, serif orné, fleurons, points de conduite jusqu'au prix. */
function render(context: TemplateContext): string {
  const { issuer, client, labels, totals } = context;
  const legal = legalIdsText(context);
  const payment = paymentLines(context);

  return `<div class="dc-page" style="font-family:${FONTS.cormorant}; color:${INK}; background:${CREAM}; padding:${u(46)} ${u(84)} ${u(30)}; text-align:center">
  <div style="font-size:${u(20)}; color:${WINE}; letter-spacing:${u(10)}">✦ ✦ ✦</div>
  ${context.logoUrl ? `<img src="${escapeHtml(context.logoUrl)}" alt="" style="display:block; margin:${u(10)} auto 0; max-height:${u(54)}; max-width:${u(200)}" />` : ''}
  <div style="font-family:${FONTS.playfair}; font-style:italic; font-size:${u(36)}; font-weight:700; margin-top:${u(8)}; line-height:1.15">${escapeHtml(issuer.name)}</div>
  <div style="font-size:${u(12.5)}; line-height:1.5; margin-top:${u(4)}">${joinLines([...issuer.addressLines, issuer.phone, issuer.email], ' · ')}</div>
  ${legal ? `<div style="font-size:${u(10.5)}; color:${MUTED}; margin-top:${u(2)}; font-variant:small-caps; letter-spacing:${u(0.5)}">${escapeHtml(legal)}</div>` : ''}

  ${ornament()}

  <div style="font-family:${FONTS.playfair}; font-size:${u(13)}; letter-spacing:${u(6)}; text-transform:uppercase">${escapeHtml(labels.document)}</div>
  <div style="font-size:${u(16)}; font-style:italic; margin-top:${u(2)}">${escapeHtml(labels.number)} ${escapeHtml(context.number)}</div>
  ${
    context.meta.length > 0
      ? `<div style="font-size:${u(12.5)}; margin-top:${u(6)}">${context.meta
          .map((entry) => `${escapeHtml(entry.label)} <i>${entry.strong ? `<b>${escapeHtml(entry.value)}</b>` : escapeHtml(entry.value)}</i>`)
          .join(` <span style="color:${WINE}">✦</span> `)}</div>`
      : ''
  }

  <div style="margin:${u(18)} auto 0; display:inline-block; border:${u(1)} solid ${INK}; outline:${u(1)} solid ${INK}; outline-offset:${u(3)}; padding:${u(8)} ${u(26)}; font-size:${u(12.5)}; line-height:1.5">
    <div style="font-size:${u(10)}; letter-spacing:${u(3)}; text-transform:uppercase; color:${MUTED}">${escapeHtml(labels.billedTo)}</div>
    <div style="font-family:${FONTS.playfair}; font-size:${u(16)}; font-style:italic">${escapeHtml(client.name)}</div>
    <div>${joinLines([client.contactName, ...client.addressLines, client.vatNumber ? `TVA ${client.vatNumber}` : ''])}</div>
  </div>

  <div style="font-family:${FONTS.playfair}; font-style:italic; font-size:${u(22)}; margin-top:${u(26)}">~ ${escapeHtml(labels.designation)} ~</div>

  <div style="text-align:right; font-size:${u(11)}; font-variant:small-caps; letter-spacing:${u(1)}; color:${MUTED}; margin-top:${u(6)}">${escapeHtml(labels.totalHt)}</div>
  <div style="text-align:left">
    ${context.lines
      .map(
        (line) => `<div style="padding:${u(8)} 0; page-break-inside:avoid">
        ${leader(`<span style="font-family:${FONTS.playfair}; font-size:${u(15)}; font-weight:600">${escapeHtml(line.title)}</span>`, `<span style="font-family:${FONTS.playfair}; font-size:${u(14)}">${escapeHtml(line.totalHt)}</span>`)}
        ${line.description ? `<div style="font-size:${u(12.5)}; font-style:italic; color:${MUTED}; margin-top:${u(1)}">${escapeHtml(line.description)}</div>` : ''}
        <div style="font-size:${u(11.5)}; color:${MUTED}; margin-top:${u(1)}">${escapeHtml(labels.quantity)} ${quantityText(line)} · ${escapeHtml(labels.unitPrice)} ${escapeHtml(line.unitPrice)} · ${escapeHtml(labels.vat)} ${escapeHtml(line.vatRate)}</div>
      </div>`,
      )
      .join('')}
  </div>

  <div class="dc-keep">
    ${ornament('❧')}
    <div style="width:${u(360)}; margin:0 auto; font-size:${u(13.5)}; text-align:left">
      ${totalsList(context)
        .filter((entry) => entry.kind !== 'final')
        .map((entry) => leader(escapeHtml(entry.label), escapeHtml(entry.value), `padding:${u(2)} 0; ${entry.kind === 'ttc' ? 'font-weight:700;' : ''}`))
        .join('')}
    </div>
    <div style="margin:${u(14)} auto 0; width:${u(360)}; border-top:${u(4)} double ${INK}; border-bottom:${u(4)} double ${INK}; padding:${u(10)} 0">
      <div style="font-size:${u(11)}; letter-spacing:${u(4)}; text-transform:uppercase">${escapeHtml(labels.amountDue)}</div>
      <div style="font-family:${FONTS.playfair}; font-size:${u(32)}; font-weight:700; color:${WINE}; line-height:1.2">${escapeHtml(totals.amountDue)}</div>
    </div>
    ${
      context.payment.terms || payment.length > 0
        ? `<div style="margin-top:${u(14)}; font-size:${u(12)}; line-height:1.55"><span style="font-variant:small-caps; letter-spacing:${u(1)}; color:${WINE}">${escapeHtml(labels.payment)}</span><br/>${joinLines([context.payment.terms, ...payment])}</div>`
        : ''
    }
    ${context.qrSvg ? `<div style="display:flex; justify-content:center; margin-top:${u(12)}">${qrSlot(context.qrSvg, 62)}</div>` : ''}
  </div>

  ${context.notes ? `<div style="margin:${u(16)} auto 0; max-width:${u(480)}; font-size:${u(13)}; font-style:italic; line-height:1.5">« ${escapeHtml(context.notes)} »</div>` : ''}

  <div class="dc-spacer"></div>
  <div style="font-family:${FONTS.playfair}; font-style:italic; font-size:${u(15)}; color:${WINE}">❦ Merci de votre visite ❦</div>
  ${context.legalMentions.length > 0 ? `<div style="font-size:${u(10)}; line-height:1.5; color:${MUTED}; margin-top:${u(8)}">${joinLines(context.legalMentions)}</div>` : ''}
</div>`;
}

export const template35: PdfTemplateDefinition = {
  id: '35',
  name: 'Addition',
  description: 'Addition de bistrot : serif orné, fleurons, points de conduite jusqu’au prix, papier crème.',
  accent: '#7A2E2A',
  paper: '#F7EFDD',
  render,
  vocabulary: 'retail',
  category: 'commerce',
  ownsLegalIds: true,
};
