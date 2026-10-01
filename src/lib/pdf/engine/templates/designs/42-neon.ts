import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, legalIdsText, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const NIGHT = '#0D0F1A';
const PANEL = '#151829';
const MAGENTA = '#FF2BD6';
const CYAN = '#22E4FF';
const TEXT = '#E8EAF6';
const DIM = '#8A8FB0';
const GRADIENT = `linear-gradient(90deg, ${MAGENTA}, ${CYAN})`;

function glow(color: string, size = 10): string {
  return `0 0 ${u(size)} ${color}, inset 0 0 ${u(size / 2)} ${color}55`;
}

/** Néon : page de nuit, barres en dégradé magenta → cyan, bordures lumineuses, chiffres en mono. */
function render(context: TemplateContext): string {
  const { issuer, client, labels, totals } = context;
  const legal = legalIdsText(context, '  //  ');
  const payment = [context.payment.terms, ...paymentLines(context)];
  const hasPayment = payment.some(Boolean);
  const mono = `font-family:${FONTS.spaceMono}`;
  const tag = (text: string, color: string) =>
    `<div style="${mono}; font-size:${u(8.5)}; letter-spacing:${u(2)}; text-transform:uppercase; color:${color}; margin-bottom:${u(6)}">// ${text}</div>`;
  const panel = (color: string, content: string, extra = '') =>
    `<div style="border:${u(1.5)} solid ${color}; border-radius:${u(10)}; box-shadow:${glow(color)}; background:${PANEL}; padding:${u(14)} ${u(16)}; ${extra}">${content}</div>`;

  return `<div class="dc-page" style="font-family:${FONTS.syne}; color:${TEXT}; background:${NIGHT}; padding:0 0 ${u(24)}">
  <div style="height:${u(6)}; background:${GRADIENT}"></div>

  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:${u(24)}; padding:${u(36)} ${u(46)} 0">
    <div style="min-width:0">
      ${context.logoUrl ? `<div style="display:inline-block; background:#fff; border-radius:${u(8)}; padding:${u(8)}; margin-bottom:${u(14)}; box-shadow:${glow(CYAN, 8)}"><img src="${escapeHtml(context.logoUrl)}" alt="" style="display:block; max-height:${u(36)}; max-width:${u(160)}" /></div>` : ''}
      <div style="font-size:${u(58)}; font-weight:800; line-height:0.95; letter-spacing:${u(-1.5)}; color:${MAGENTA}; text-shadow:0 0 ${u(14)} ${MAGENTA}">${escapeHtml(labels.document)}</div>
      <div style="width:${u(220)}; height:${u(4)}; border-radius:${u(4)}; background:${GRADIENT}; margin-top:${u(10)}; box-shadow:0 0 ${u(10)} ${CYAN}"></div>
      <div style="${mono}; font-size:${u(16)}; color:${CYAN}; margin-top:${u(12)}; text-shadow:0 0 ${u(8)} ${CYAN}">${escapeHtml(labels.number)} ${escapeHtml(context.number)}</div>
    </div>
    <div style="text-align:right; max-width:${u(280)}">
      ${tag(escapeHtml(labels.issuer), CYAN)}
      <div style="font-size:${u(17)}; font-weight:700">${escapeHtml(issuer.name)}</div>
      <div style="font-size:${u(10)}; line-height:1.6; color:${DIM}; margin-top:${u(4)}">${joinLines([...issuer.addressLines, issuer.phone, issuer.email])}</div>
      ${legal ? `<div style="${mono}; font-size:${u(8.5)}; color:${DIM}; margin-top:${u(4)}">${escapeHtml(legal)}</div>` : ''}
    </div>
  </div>

  <div style="display:flex; gap:${u(18)}; padding:${u(28)} ${u(46)} 0">
    ${panel(
      MAGENTA,
      `${tag(escapeHtml(labels.billedTo), MAGENTA)}
      <div style="font-size:${u(15)}; font-weight:700">${escapeHtml(client.name)}</div>
      ${client.contactName ? `<div style="font-size:${u(10.5)}; color:${DIM}">${escapeHtml(client.contactName)}</div>` : ''}
      <div style="font-size:${u(10.5)}; line-height:1.6; color:${DIM}; margin-top:${u(2)}">${joinLines(client.addressLines)}</div>
      ${client.vatNumber ? `<div style="${mono}; font-size:${u(9)}; color:${DIM}; margin-top:${u(4)}">TVA ${escapeHtml(client.vatNumber)}</div>` : ''}`,
      'flex:1.3; min-width:0',
    )}
    ${panel(
      CYAN,
      context.meta
        .map(
          (entry) => `<div style="display:flex; justify-content:space-between; gap:${u(10)}; padding:${u(4)} 0; border-bottom:${u(1)} dashed #2A2F4D">
          <span style="font-size:${u(10)}; color:${DIM}">${escapeHtml(entry.label)}</span>
          <span style="${mono}; font-size:${u(11)}; color:${entry.strong ? CYAN : TEXT}">${escapeHtml(entry.value)}</span></div>`,
        )
        .join('') || '&nbsp;',
      'flex:1; min-width:0',
    )}
  </div>

  <div style="padding:${u(28)} ${u(46)} 0">
    <div style="display:flex; gap:${u(12)}; padding:0 ${u(14)} ${u(8)}; ${mono}; font-size:${u(8.5)}; letter-spacing:${u(1.5)}; text-transform:uppercase; color:${CYAN}">
      <span style="flex:1">${escapeHtml(labels.designation)}</span>
      <span style="width:${u(70)}; text-align:right">${escapeHtml(labels.quantity)}</span>
      <span style="width:${u(88)}; text-align:right">${escapeHtml(labels.unitPrice)}</span>
      <span style="width:${u(50)}; text-align:right">${escapeHtml(labels.vat)}</span>
      <span style="width:${u(96)}; text-align:right">${escapeHtml(labels.totalHt)}</span>
    </div>
    <div style="height:${u(2)}; background:${GRADIENT}"></div>
    ${context.lines
      .map(
        (line, position) => `<div style="display:flex; gap:${u(12)}; align-items:flex-start; padding:${u(11)} ${u(14)}; border-bottom:${u(1)} solid #23273F; ${position % 2 === 1 ? `background:${PANEL};` : ''} page-break-inside:avoid">
        <div style="flex:1; min-width:0">
          <div style="font-size:${u(12)}; font-weight:700"><span style="${mono}; color:${MAGENTA}; font-size:${u(10)}">${String(line.index).padStart(2, '0')}</span>&nbsp; ${escapeHtml(line.title)}</div>
          ${line.description ? `<div style="font-size:${u(9.5)}; color:${DIM}; margin-top:${u(3)}; line-height:1.5">${escapeHtml(line.description)}</div>` : ''}
        </div>
        <span style="width:${u(70)}; text-align:right; ${mono}; font-size:${u(10.5)}">${quantityText(line)}</span>
        <span style="width:${u(88)}; text-align:right; ${mono}; font-size:${u(10.5)}">${escapeHtml(line.unitPrice)}</span>
        <span style="width:${u(50)}; text-align:right; ${mono}; font-size:${u(10)}; color:${DIM}">${escapeHtml(line.vatRate)}</span>
        <span style="width:${u(96)}; text-align:right; ${mono}; font-size:${u(11)}; color:${CYAN}">${escapeHtml(line.totalHt)}</span>
      </div>`,
      )
      .join('')}
  </div>

  <div class="dc-keep" style="display:flex; gap:${u(22)}; align-items:flex-start; padding:${u(26)} ${u(46)} 0">
    <div style="flex:1; min-width:0">
      ${
        hasPayment || context.qrSvg
          ? panel(
              CYAN,
              `${tag(escapeHtml(labels.payment), CYAN)}
          <div style="display:flex; gap:${u(14)}; align-items:flex-start">
            <div style="flex:1; min-width:0; ${mono}; font-size:${u(9.5)}; line-height:1.7; word-break:break-word">${joinLines(payment)}</div>
            ${context.qrSvg ? `<div style="background:#fff; padding:${u(5)}; border-radius:${u(6)}">${qrSlot(context.qrSvg, 60)}</div>` : ''}
          </div>`,
            )
          : ''
      }
      ${context.notes ? `<div style="margin-top:${u(14)}; font-size:${u(10)}; line-height:1.6; color:${DIM}; border-left:${u(3)} solid ${MAGENTA}; padding-left:${u(10)}">${escapeHtml(context.notes)}</div>` : ''}
    </div>
    <div style="width:${u(300)}">
      ${totalsList(context)
        .filter((entry) => entry.kind !== 'final')
        .map(
          (entry) => `<div style="display:flex; justify-content:space-between; gap:${u(10)}; padding:${u(5)} ${u(4)}; font-size:${u(10.5)}; ${entry.kind === 'ttc' ? `color:${TEXT}; font-weight:700;` : `color:${DIM};`}"><span>${escapeHtml(entry.label)}</span><span style="${mono}">${escapeHtml(entry.value)}</span></div>`,
        )
        .join('')}
      <div style="margin-top:${u(12)}; border-radius:${u(12)}; padding:${u(2)}; background:${GRADIENT}; box-shadow:0 0 ${u(16)} ${MAGENTA}88, 0 0 ${u(22)} ${CYAN}66">
        <div style="background:${NIGHT}; border-radius:${u(10)}; padding:${u(12)} ${u(16)}">
          <div style="font-size:${u(9)}; letter-spacing:${u(2)}; text-transform:uppercase; color:${MAGENTA}; font-weight:700">${escapeHtml(labels.amountDue)}</div>
          <div style="${mono}; font-size:${u(26)}; font-weight:700; color:${CYAN}; text-shadow:0 0 ${u(10)} ${CYAN}; margin-top:${u(2)}; white-space:nowrap">${escapeHtml(totals.amountDue)}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="dc-spacer"></div>
  ${context.legalMentions.length > 0 ? `<div style="padding:0 ${u(46)} ${u(12)}; font-size:${u(8.5)}; line-height:1.6; color:${DIM}">${joinLines(context.legalMentions)}</div>` : ''}
  <div style="margin:0 ${u(46)}; height:${u(2)}; background:${GRADIENT}; box-shadow:0 0 ${u(8)} ${MAGENTA}"></div>
</div>`;
}

export const template42: PdfTemplateDefinition = {
  id: '42',
  name: 'Néon',
  description: 'Page de nuit, titres Syne en néon magenta et cyan, bordures lumineuses et chiffres en mono.',
  accent: MAGENTA,
  paper: NIGHT,
  render,
  vocabulary: 'studio',
  category: 'tech',
  ownsLegalIds: true,
};
