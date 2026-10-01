import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, legalIdsText, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const INK = '#2B2416';
const MUTED = '#7C6F57';
const GOLD = '#B08D3C';
const PAPER = '#FBF8F0';

/** Ornement d'angle : losange doré dans un carré, orienté vers le centre. */
function corner(position: string): string {
  return `<div style="position:absolute; ${position}; width:${u(46)}; height:${u(46)}; border:${u(1.5)} solid ${GOLD}; background:${PAPER}; display:flex; align-items:center; justify-content:center; color:${GOLD}; font-size:${u(22)}; line-height:1">✥</div>`;
}

/** Filet doré interrompu par un motif. */
function divider(glyph = '◆', width = 360): string {
  return `<div style="display:flex; align-items:center; gap:${u(10)}; width:${u(width)}; margin:${u(14)} auto; color:${GOLD}">
    <span style="flex:1; height:${u(1)}; background:linear-gradient(90deg, transparent, ${GOLD})"></span>
    <span style="font-size:${u(11)}; line-height:1">${glyph}</span>
    <span style="flex:1; height:${u(1)}; background:linear-gradient(90deg, ${GOLD}, transparent)"></span>
  </div>`;
}

/** Certificat : double cadre doré, ornements d'angle, tout centré, sceau aux initiales. */
function render(context: TemplateContext): string {
  const { issuer, client, labels, totals } = context;
  const legal = legalIdsText(context);
  const payment = paymentLines(context);
  const cellStyle = `padding:${u(7)} ${u(8)}; border-bottom:${u(1)} solid rgba(176,141,60,.35)`;

  return `<div class="dc-page" style="font-family:${FONTS.cormorant}; color:${INK}; background:${PAPER}; box-shadow:inset 0 0 0 ${u(20)} ${PAPER}, inset 0 0 0 ${u(23)} ${GOLD}, inset 0 0 0 ${u(28)} ${PAPER}, inset 0 0 0 ${u(29)} ${GOLD}; padding:${u(60)} ${u(70)} ${u(46)}; text-align:center">
  ${corner(`top:${u(9)}; left:${u(9)}`)}
  ${corner(`top:${u(9)}; right:${u(9)}`)}
  ${corner(`bottom:${u(9)}; left:${u(9)}`)}
  ${corner(`bottom:${u(9)}; right:${u(9)}`)}

  ${context.logoUrl ? `<img src="${escapeHtml(context.logoUrl)}" alt="" style="display:block; margin:0 auto ${u(8)}; max-height:${u(48)}; max-width:${u(200)}" />` : ''}
  <div style="font-family:${FONTS.cormorant}; font-size:${u(22)}; font-weight:700; letter-spacing:${u(6)}; text-transform:uppercase; color:${INK}; text-shadow:0 ${u(1)} 0 #fff, 0 ${u(-1)} 0 rgba(0,0,0,.18)">${escapeHtml(issuer.name)}</div>
  <div style="font-size:${u(12)}; line-height:1.5; color:${MUTED}; margin-top:${u(3)}">${joinLines([...issuer.addressLines, issuer.phone, issuer.email], ' · ')}</div>
  ${legal ? `<div style="font-size:${u(10.5)}; color:${MUTED}; letter-spacing:${u(0.5)}">${escapeHtml(legal)}</div>` : ''}

  ${divider('❖', 420)}

  <div style="font-family:${FONTS.playfair}; font-size:${u(50)}; font-style:italic; font-weight:400; line-height:1.05; color:${INK}">${escapeHtml(labels.document)}</div>
  <div style="font-size:${u(13)}; letter-spacing:${u(4)}; text-transform:uppercase; color:${GOLD}; margin-top:${u(6)}">${escapeHtml(labels.number)} ${escapeHtml(context.number)}</div>

  <div style="font-size:${u(13)}; font-style:italic; color:${MUTED}; margin-top:${u(18)}">${escapeHtml(labels.billedTo)}</div>
  <div style="font-family:${FONTS.playfair}; font-size:${u(24)}; margin-top:${u(2)}">${escapeHtml(client.name)}</div>
  <div style="font-size:${u(12.5)}; line-height:1.5; color:${MUTED}">${joinLines([client.contactName, ...client.addressLines, client.vatNumber ? `TVA ${client.vatNumber}` : ''], ' · ')}</div>

  ${
    context.meta.length > 0
      ? `<div style="display:flex; justify-content:center; gap:${u(30)}; margin-top:${u(16)}">${context.meta
          .map(
            (entry) =>
              `<div><div style="font-size:${u(10)}; letter-spacing:${u(2)}; text-transform:uppercase; color:${GOLD}">${escapeHtml(entry.label)}</div><div style="font-size:${u(14)}; ${entry.strong ? 'font-weight:700;' : ''}">${escapeHtml(entry.value)}</div></div>`,
          )
          .join('')}</div>`
      : ''
  }

  ${divider()}

  <table style="width:100%; border-collapse:collapse; font-size:${u(13)}">
    <thead><tr style="font-size:${u(10)}; letter-spacing:${u(2)}; text-transform:uppercase; color:${GOLD}">
      <th style="${cellStyle}; text-align:left; font-weight:600; border-bottom:${u(1)} solid ${GOLD}">${escapeHtml(labels.designation)}</th>
      <th style="${cellStyle}; font-weight:600; width:${u(72)}; border-bottom:${u(1)} solid ${GOLD}">${escapeHtml(labels.quantity)}</th>
      <th style="${cellStyle}; font-weight:600; width:${u(96)}; border-bottom:${u(1)} solid ${GOLD}">${escapeHtml(labels.unitPrice)}</th>
      <th style="${cellStyle}; font-weight:600; width:${u(54)}; border-bottom:${u(1)} solid ${GOLD}">${escapeHtml(labels.vat)}</th>
      <th style="${cellStyle}; text-align:right; font-weight:600; width:${u(104)}; border-bottom:${u(1)} solid ${GOLD}">${escapeHtml(labels.totalHt)}</th>
    </tr></thead>
    <tbody>${context.lines
      .map(
        (line) => `<tr>
        <td style="${cellStyle}; text-align:left"><span style="font-weight:600">${escapeHtml(line.title)}</span>${line.description ? `<div style="font-size:${u(11.5)}; font-style:italic; color:${MUTED}">${escapeHtml(line.description)}</div>` : ''}</td>
        <td style="${cellStyle}">${quantityText(line)}</td>
        <td style="${cellStyle}">${escapeHtml(line.unitPrice)}</td>
        <td style="${cellStyle}; color:${MUTED}">${escapeHtml(line.vatRate)}</td>
        <td style="${cellStyle}; text-align:right; font-weight:600">${escapeHtml(line.totalHt)}</td>
      </tr>`,
      )
      .join('')}</tbody>
  </table>

  <div class="dc-keep" style="margin-top:${u(18)}">
    <div style="width:${u(340)}; margin:0 auto; font-size:${u(13)}">
      ${totalsList(context)
        .filter((entry) => entry.kind !== 'final')
        .map(
          (entry) =>
            `<div style="display:flex; justify-content:space-between; padding:${u(2)} 0; ${entry.kind === 'ttc' ? 'font-weight:700;' : ''}"><span style="${entry.kind === 'row' ? `color:${MUTED}` : ''}">${escapeHtml(entry.label)}</span><span>${escapeHtml(entry.value)}</span></div>`,
        )
        .join('')}
    </div>
    <div style="display:inline-block; margin-top:${u(14)}; border-top:${u(1)} solid ${GOLD}; border-bottom:${u(1)} solid ${GOLD}; padding:${u(8)} ${u(40)}">
      <div style="font-size:${u(11)}; letter-spacing:${u(4)}; text-transform:uppercase; color:${GOLD}">${escapeHtml(labels.amountDue)}</div>
      <div style="font-family:${FONTS.playfair}; font-size:${u(30)}; font-weight:700; line-height:1.2">${escapeHtml(totals.amountDue)}</div>
    </div>
    ${
      context.payment.terms || payment.length > 0
        ? `<div style="margin-top:${u(12)}; font-size:${u(12)}; line-height:1.55"><span style="font-style:italic; color:${GOLD}">${escapeHtml(labels.payment)}</span><br/>${joinLines([context.payment.terms, ...payment], ' · ')}</div>`
        : ''
    }
    ${context.notes ? `<div style="margin:${u(10)} auto 0; max-width:${u(500)}; font-size:${u(13)}; font-style:italic; line-height:1.5">${escapeHtml(context.notes)}</div>` : ''}
  </div>

  <div class="dc-spacer"></div>
  <div style="display:flex; justify-content:space-between; align-items:center; gap:${u(20)}">
    <div style="flex:1; text-align:left; font-size:${u(10)}; line-height:1.5; color:${MUTED}">${joinLines(context.legalMentions)}</div>
    <div style="width:${u(96)}; height:${u(96)}; border-radius:50%; flex-shrink:0; background:radial-gradient(circle at 35% 30%, #D9BC72, ${GOLD} 60%, #8A6A25); box-shadow:0 0 0 ${u(4)} ${PAPER}, 0 0 0 ${u(5)} ${GOLD}; display:flex; align-items:center; justify-content:center">
      <div style="width:${u(74)}; height:${u(74)}; border-radius:50%; border:${u(1.5)} dashed rgba(255,255,255,.7); display:flex; flex-direction:column; align-items:center; justify-content:center; color:#FFF8E6">
        <div style="font-size:${u(7)}; letter-spacing:${u(2)}">✦ ✦ ✦</div>
        <div style="font-family:${FONTS.playfair}; font-size:${u(24)}; font-weight:700; line-height:1.1">${escapeHtml(issuer.initials)}</div>
        <div style="font-size:${u(7)}; letter-spacing:${u(2)}">✦ ✦ ✦</div>
      </div>
    </div>
    <div style="flex:1; display:flex; justify-content:flex-end">${qrSlot(context.qrSvg, 60)}</div>
  </div>
</div>`;
}

export const template37: PdfTemplateDefinition = {
  id: '37',
  name: 'Certificat',
  description: 'Certificat : double cadre doré, ornements d’angle, mise en page centrée et sceau aux initiales.',
  accent: '#B08D3C',
  paper: '#FBF8F0',
  render,
  vocabulary: 'formal',
  category: 'elegant',
  ownsLegalIds: true,
};
