import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, legalIdsText, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const INK = '#1C1B22';
const MUTED = '#77757F';
const CARD = '#F6F3EF';
const ACCENT = '#E0563B';

/** Boutique en ligne : récapitulatif de commande, cartes arrondies, vignettes d'article. */
function render(context: TemplateContext): string {
  const { issuer, client, labels, totals } = context;
  const legal = legalIdsText(context);

  return `<div class="dc-page" style="font-family:${FONTS.manrope}; color:${INK}; background:#fff; padding:${u(44)} ${u(48)}">
  <div style="display:flex; justify-content:space-between; align-items:center">
    ${context.logoUrl ? `<img src="${escapeHtml(context.logoUrl)}" alt="" style="max-height:${u(40)}; max-width:${u(180)}" />` : `<div style="font-family:${FONTS.syne}; font-size:${u(22)}; font-weight:800">${escapeHtml(issuer.name)}</div>`}
    <div style="background:${ACCENT}; color:#fff; border-radius:${u(40)}; padding:${u(6)} ${u(16)}; font-size:${u(11)}; font-weight:700">${escapeHtml(labels.document)} ${escapeHtml(context.number)}</div>
  </div>

  <div style="font-family:${FONTS.syne}; font-size:${u(30)}; font-weight:800; margin-top:${u(28)}">${context.kind === 'quote' ? 'Votre devis' : 'Merci'}, ${escapeHtml(client.name)} !</div>
  <div style="font-size:${u(12)}; color:${MUTED}; margin-top:${u(4)}">${context.kind === 'quote' ? 'Voici notre proposition.' : 'Voici le récapitulatif de votre commande.'}</div>

  <div style="display:flex; gap:${u(14)}; margin-top:${u(22)}">
    ${context.meta
      .map(
        (entry) => `<div style="flex:1; background:${CARD}; border-radius:${u(14)}; padding:${u(12)} ${u(14)}">
        <div style="font-size:${u(9.5)}; color:${MUTED}">${escapeHtml(entry.label)}</div>
        <div style="font-size:${u(13)}; font-weight:700; margin-top:${u(2)}">${escapeHtml(entry.value)}</div></div>`,
      )
      .join('')}
  </div>

  <div style="margin-top:${u(24)}">
    ${context.lines
      .map(
        (line) => `<div style="display:flex; align-items:center; gap:${u(14)}; padding:${u(10)} 0; border-bottom:${u(1)} solid #EEE">
        <div style="width:${u(46)}; height:${u(46)}; border-radius:${u(12)}; background:${CARD}; display:flex; align-items:center; justify-content:center; font-family:${FONTS.syne}; font-weight:800; font-size:${u(16)}; color:${ACCENT}">${escapeHtml(line.title.charAt(0).toUpperCase())}</div>
        <div style="flex:1">
          <div style="font-size:${u(13)}; font-weight:700">${escapeHtml(line.title)}</div>
          <div style="font-size:${u(10.5)}; color:${MUTED}">${line.description ? `${escapeHtml(line.description)} · ` : ''}${quantityText(line)} × ${escapeHtml(line.unitPrice)}</div>
        </div>
        <div style="font-size:${u(13)}; font-weight:700">${escapeHtml(line.totalHt)}</div>
      </div>`,
      )
      .join('')}
  </div>

  <div class="dc-keep" style="display:flex; gap:${u(18)}; margin-top:${u(20)}">
    <div style="flex:1; display:flex; flex-direction:column; gap:${u(12)}">
      <div style="background:${CARD}; border-radius:${u(14)}; padding:${u(12)} ${u(14)}; font-size:${u(10.5)}; line-height:1.55">
        <div style="font-size:${u(9.5)}; color:${MUTED}">${escapeHtml(labels.billedTo)}</div>
        <b>${escapeHtml(client.name)}</b><br/>${joinLines([...client.addressLines, client.email])}
      </div>
      <div style="background:${CARD}; border-radius:${u(14)}; padding:${u(12)} ${u(14)}; font-size:${u(10.5)}; line-height:1.55">
        <div style="font-size:${u(9.5)}; color:${MUTED}">${escapeHtml(labels.issuer)}</div>
        <b>${escapeHtml(issuer.name)}</b><br/>${joinLines([...issuer.addressLines, legal])}
      </div>
    </div>
    <div style="width:${u(300)}; border:${u(2)} solid ${INK}; border-radius:${u(16)}; padding:${u(14)} ${u(16)}; font-size:${u(11.5)}">
      ${totalsList(context)
        .filter((entry) => entry.kind !== 'final')
        .map((entry) => `<div style="display:flex; justify-content:space-between; padding:${u(3)} 0"><span style="color:${MUTED}">${escapeHtml(entry.label)}</span><span>${escapeHtml(entry.value)}</span></div>`)
        .join('')}
      <div style="display:flex; justify-content:space-between; align-items:baseline; border-top:${u(1)} solid #DDD; margin-top:${u(8)}; padding-top:${u(10)}">
        <b>${escapeHtml(labels.amountDue)}</b><span style="font-family:${FONTS.syne}; font-size:${u(24)}; font-weight:800; color:${ACCENT}">${escapeHtml(totals.amountDue)}</span>
      </div>
    </div>
  </div>

  ${context.notes ? `<div style="margin-top:${u(18)}; font-size:${u(11)}; color:${MUTED}">${escapeHtml(context.notes)}</div>` : ''}

  <div class="dc-spacer"></div>
  <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:${u(20)}; font-size:${u(9)}; color:${MUTED}; line-height:1.6">
    <div>${joinLines([context.payment.terms, ...paymentLines(context), ...context.legalMentions])}</div>
    ${qrSlot(context.qrSvg, 62)}
  </div>
</div>`;
}

export const template32: PdfTemplateDefinition = {
  id: '32',
  name: 'Boutique',
  description: 'E-commerce : récapitulatif de commande, cartes arrondies, vignettes d’articles.',
  accent: '#E0563B',
  paper: '#FFFFFF',
  render,
  vocabulary: 'retail',
  category: 'commerce',
  ownsLegalIds: true,
};
