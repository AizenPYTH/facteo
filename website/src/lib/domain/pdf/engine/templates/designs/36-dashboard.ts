import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, legalIdsText, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const INK = '#0F172A';
const SLATE = '#475569';
const MUTED = '#94A3B8';
const BG = '#F1F5F9';
const CARD = '#FFFFFF';
const BORDER = '#E2E8F0';
const TEAL = '#0D9488';
const TEAL_SOFT = '#CCFBF1';

/**
 * Relit un montant déjà formaté (« 1 234,56 € ») pour dimensionner les barres.
 * Purement graphique : aucun chiffre affiché n'en dépend.
 */
function amountOf(formatted: string): number {
  const negative = /[-−]/.test(formatted);
  const digits = formatted.replace(/[^\d,.]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const value = Number.parseFloat(digits);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return negative ? -value : value;
}

/** Part de chaque ligne dans le total HT, en pourcentage. Repli : barres décroissantes. */
function lineShares(context: TemplateContext): number[] {
  const amounts = context.lines.map((line) => Math.max(0, amountOf(line.totalHt)));
  const sum = amounts.reduce((total, value) => total + value, 0);
  if (sum <= 0) {
    return context.lines.map((_, index) => Math.max(12, 100 - index * (80 / Math.max(1, context.lines.length))));
  }
  return amounts.map((value) => (value / sum) * 100);
}

function card(content: string, extra = ''): string {
  return `<div style="background:${CARD}; border:${u(1)} solid ${BORDER}; border-radius:${u(12)}; padding:${u(14)} ${u(16)}; ${extra}">${content}</div>`;
}

function caption(text: string, color = MUTED): string {
  return `<div style="font-size:${u(9)}; font-weight:600; text-transform:uppercase; letter-spacing:${u(1)}; color:${color}">${text}</div>`;
}

/** Tableau de bord : rangée d'indicateurs, puis chaque ligne avec sa barre de part du total. */
function render(context: TemplateContext): string {
  const { issuer, client, labels, totals } = context;
  const legal = legalIdsText(context);
  const payment = paymentLines(context);
  const shares = lineShares(context);
  const maxShare = Math.max(...shares, 1);
  const due = context.meta.find((entry) => entry.strong) ?? context.meta[0] ?? null;

  const kpis = [
    { label: labels.amountDue, value: totals.amountDue, highlight: true },
    due ? { label: due.label, value: due.value, highlight: false } : null,
    { label: 'Lignes', value: String(context.lines.length), highlight: false },
    { label: labels.vat, value: totals.totalVat, highlight: false },
  ].filter((entry): entry is { label: string; value: string; highlight: boolean } => entry !== null);

  return `<div class="dc-page" style="font-family:${FONTS.workSans}; color:${INK}; background:${BG}; padding:${u(36)} ${u(40)} ${u(26)}">
  <div style="display:flex; justify-content:space-between; align-items:center; gap:${u(16)}">
    <div style="display:flex; align-items:center; gap:${u(12)}">
      ${context.logoUrl ? `<img src="${escapeHtml(context.logoUrl)}" alt="" style="max-height:${u(38)}; max-width:${u(160)}" />` : `<div style="width:${u(38)}; height:${u(38)}; border-radius:${u(10)}; background:${TEAL}; color:#fff; display:flex; align-items:center; justify-content:center; font-family:${FONTS.grotesk}; font-weight:700; font-size:${u(14)}">${escapeHtml(issuer.initials)}</div>`}
      <div>
        <div style="font-family:${FONTS.grotesk}; font-size:${u(17)}; font-weight:700">${escapeHtml(issuer.name)}</div>
        <div style="font-size:${u(9.5)}; color:${SLATE}">${joinLines([...issuer.addressLines, issuer.phone, issuer.email], ' · ')}</div>
        ${legal ? `<div style="font-size:${u(9)}; color:${MUTED}">${escapeHtml(legal)}</div>` : ''}
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-family:${FONTS.grotesk}; font-size:${u(24)}; font-weight:700; letter-spacing:${u(-0.5)}">${escapeHtml(labels.document)}</div>
      <div style="display:inline-block; margin-top:${u(4)}; background:${INK}; color:#fff; border-radius:${u(20)}; padding:${u(3)} ${u(12)}; font-family:${FONTS.grotesk}; font-size:${u(10.5)}">${escapeHtml(labels.number)} ${escapeHtml(context.number)}</div>
    </div>
  </div>

  <div style="display:flex; gap:${u(12)}; margin-top:${u(22)}">
    ${kpis
      .map((kpi) =>
        card(
          `${caption(escapeHtml(kpi.label), kpi.highlight ? TEAL_SOFT : MUTED)}<div style="font-family:${FONTS.grotesk}; font-size:${u(kpi.highlight ? 22 : 17)}; font-weight:700; margin-top:${u(6)}; color:${kpi.highlight ? '#fff' : INK}">${escapeHtml(kpi.value)}</div>`,
          `flex:${kpi.highlight ? 1.5 : 1}; ${kpi.highlight ? `background:${TEAL}; border-color:${TEAL};` : ''}`,
        ),
      )
      .join('')}
  </div>

  <div style="display:flex; gap:${u(12)}; margin-top:${u(12)}">
    ${card(
      `${caption(escapeHtml(labels.billedTo))}<div style="font-weight:600; font-size:${u(12.5)}; margin-top:${u(4)}">${escapeHtml(client.name)}</div><div style="font-size:${u(10)}; color:${SLATE}; line-height:1.55">${joinLines([client.contactName, ...client.addressLines, client.email, client.vatNumber ? `TVA ${client.vatNumber}` : ''])}</div>`,
      'flex:1',
    )}
    ${card(
      context.meta
        .map(
          (entry) =>
            `<div style="display:flex; justify-content:space-between; gap:${u(12)}; font-size:${u(10.5)}; padding:${u(3)} 0"><span style="color:${SLATE}">${escapeHtml(entry.label)}</span><span style="font-weight:${entry.strong ? 700 : 500}">${escapeHtml(entry.value)}</span></div>`,
        )
        .join('') || `<div style="font-size:${u(10.5)}; color:${SLATE}">${escapeHtml(labels.number)} ${escapeHtml(context.number)}</div>`,
      'flex:1',
    )}
  </div>

  ${card(
    `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:${u(6)}">${caption(escapeHtml(labels.designation))}${caption(escapeHtml(labels.totalHt))}</div>
    ${context.lines
      .map(
        (line, index) => `<div style="padding:${u(10)} 0; border-top:${u(1)} solid ${BORDER}; page-break-inside:avoid">
        <div style="display:flex; justify-content:space-between; gap:${u(16)}">
          <div style="flex:1">
            <div style="font-weight:600; font-size:${u(11.5)}">${escapeHtml(line.title)}</div>
            ${line.description ? `<div style="font-size:${u(9.5)}; color:${SLATE}">${escapeHtml(line.description)}</div>` : ''}
            <div style="font-size:${u(9.5)}; color:${MUTED}; margin-top:${u(2)}">${escapeHtml(labels.quantity)} ${quantityText(line)} · ${escapeHtml(labels.unitPrice)} ${escapeHtml(line.unitPrice)} · ${escapeHtml(labels.vat)} ${escapeHtml(line.vatRate)}</div>
          </div>
          <div style="text-align:right; font-family:${FONTS.grotesk}; font-weight:700; font-size:${u(12.5)}; white-space:nowrap">${escapeHtml(line.totalHt)}</div>
        </div>
        <div style="display:flex; align-items:center; gap:${u(10)}; margin-top:${u(6)}">
          <div style="flex:1; height:${u(7)}; border-radius:${u(4)}; background:${BG}; overflow:hidden">
            <div style="height:100%; width:${(((shares[index] ?? 0) / maxShare) * 100).toFixed(1)}%; min-width:${u(4)}; border-radius:${u(4)}; background:${TEAL}"></div>
          </div>
          <div style="width:${u(38)}; text-align:right; font-family:${FONTS.grotesk}; font-size:${u(9.5)}; color:${SLATE}">${Math.round(shares[index] ?? 0)} %</div>
        </div>
      </div>`,
      )
      .join('')}`,
    `margin-top:${u(12)}`,
  )}

  <div class="dc-keep" style="display:flex; gap:${u(12)}; margin-top:${u(12)}; align-items:stretch">
    ${card(
      `${context.payment.terms || payment.length > 0 ? `${caption(escapeHtml(labels.payment))}<div style="font-size:${u(10)}; line-height:1.6; margin-top:${u(4)}">${joinLines([context.payment.terms, ...payment])}</div>` : ''}
      ${context.notes ? `<div style="font-size:${u(10)}; color:${SLATE}; line-height:1.55; margin-top:${u(8)}; padding:${u(8)} ${u(10)}; background:${BG}; border-radius:${u(8)}">${escapeHtml(context.notes)}</div>` : ''}
      ${context.qrSvg ? `<div style="margin-top:${u(10)}">${qrSlot(context.qrSvg, 60)}</div>` : ''}`,
      'flex:1',
    )}
    ${card(
      `${totalsList(context)
        .filter((entry) => entry.kind !== 'final')
        .map(
          (entry) =>
            `<div style="display:flex; justify-content:space-between; font-size:${u(10.5)}; padding:${u(4)} 0; ${entry.kind === 'ttc' ? `font-weight:700; border-top:${u(1)} solid ${BORDER}; margin-top:${u(2)}; padding-top:${u(6)}` : ''}"><span style="color:${entry.kind === 'row' ? SLATE : INK}">${escapeHtml(entry.label)}</span><span>${escapeHtml(entry.value)}</span></div>`,
        )
        .join('')}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:${u(10)}; padding:${u(10)} ${u(12)}; border-radius:${u(10)}; background:${INK}; color:#fff">
        <span style="font-size:${u(10.5)}; font-weight:600">${escapeHtml(labels.amountDue)}</span>
        <span style="font-family:${FONTS.grotesk}; font-size:${u(18)}; font-weight:700; color:#5EEAD4">${escapeHtml(totals.amountDue)}</span>
      </div>`,
      `width:${u(300)}`,
    )}
  </div>

  <div class="dc-spacer"></div>
  ${context.legalMentions.length > 0 ? `<div style="font-size:${u(8.5)}; line-height:1.6; color:${SLATE}; border-top:${u(1)} solid ${BORDER}; padding-top:${u(10)}">${joinLines(context.legalMentions)}</div>` : ''}
</div>`;
}

export const template36: PdfTemplateDefinition = {
  id: '36',
  name: 'Tableau de bord',
  description: "Tableau de bord : indicateurs clés en tête, chaque ligne avec sa barre de part du total.",
  accent: '#0D9488',
  paper: '#F1F5F9',
  render,
  vocabulary: 'studio',
  category: 'tech',
  ownsLegalIds: true,
};
