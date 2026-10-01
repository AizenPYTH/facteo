import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { FONTS, escapeHtml, qrSlot, u } from '@/lib/pdf/engine/templates/shared';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { joinLines, legalIdsText, paymentLines, quantityText, totalsList } from '@/lib/pdf/engine/templates/designs/kit';

const INK = '#23324A';
const PAPER = '#FBF6EA';
const RED = '#C8352E';
const BLUE = '#1F4E9C';
const MUTED = '#6B7488';

/** Courrier : enveloppe par avion, timbre dentelé, cachet de la poste et adresse tapée à la machine. */
function render(context: TemplateContext): string {
  const { issuer, client, labels, totals } = context;
  const legal = legalIdsText(context);
  const airmail = `repeating-linear-gradient(135deg, ${RED} 0 ${u(16)}, ${PAPER} ${u(16)} ${u(24)}, ${BLUE} ${u(24)} ${u(40)}, ${PAPER} ${u(40)} ${u(48)})`;
  const mono = (text: string, size: number, extra = '') =>
    `<span style="font-family:${FONTS.courier}; font-size:${u(size)}; ${extra}">${text}</span>`;
  const postmarkDate = context.issuedAt ?? context.secondaryDate ?? '';
  const payment = paymentLines(context);

  return `<div class="dc-page" style="font-family:${FONTS.lora}; color:${INK}; border:${u(14)} solid transparent; background:linear-gradient(${PAPER}, ${PAPER}) padding-box, ${airmail} border-box; padding:${u(30)} ${u(38)} ${u(22)}">
  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:${u(20)}">
    <div style="max-width:${u(300)}; font-size:${u(10.5)}; line-height:1.55">
      ${context.logoUrl ? `<img src="${escapeHtml(context.logoUrl)}" alt="" style="display:block; max-height:${u(40)}; max-width:${u(170)}; margin-bottom:${u(6)}" />` : ''}
      <div style="font-size:${u(8.5)}; letter-spacing:${u(2)}; text-transform:uppercase; color:${MUTED}">${escapeHtml(labels.issuer)}</div>
      <div style="font-size:${u(15)}; font-weight:700; font-style:italic">${escapeHtml(issuer.name)}</div>
      <div>${joinLines([...issuer.addressLines, issuer.phone, issuer.email])}</div>
      ${legal ? `<div style="font-size:${u(9)}; color:${MUTED}; margin-top:${u(3)}">${escapeHtml(legal)}</div>` : ''}
    </div>

    <div style="display:flex; align-items:flex-start; gap:${u(4)}">
      ${
        postmarkDate
          ? `<div style="position:relative; margin-top:${u(18)}; display:flex; align-items:center">
        <div style="width:${u(70)}; height:${u(54)}; margin-right:${u(-14)}; background:repeating-linear-gradient(180deg, transparent 0 ${u(7)}, rgba(35,50,74,.55) ${u(7)} ${u(9)}); border-radius:${u(30)}"></div>
        <div style="width:${u(108)}; height:${u(108)}; border-radius:50%; border:${u(2.5)} solid rgba(35,50,74,.75); box-shadow:inset 0 0 0 ${u(5)} ${PAPER}, inset 0 0 0 ${u(6.5)} rgba(35,50,74,.75); transform:rotate(-14deg); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; color:rgba(35,50,74,.85); background:${PAPER}">
          ${mono('★ ' + escapeHtml(labels.issuedAt).toUpperCase() + ' ★', 7, `letter-spacing:${u(0.5)}`)}
          ${mono(escapeHtml(postmarkDate), 12, 'font-weight:700; margin:' + u(3) + ' 0')}
          ${mono('POSTE', 8, `letter-spacing:${u(3)}`)}
        </div>
      </div>`
          : ''
      }
      <div style="padding:${u(6)}; background:radial-gradient(circle, ${PAPER} ${u(3.2)}, transparent ${u(3.6)}) ${u(-5)} ${u(-5)} / ${u(10)} ${u(10)}, ${RED}; transform:rotate(3deg)">
        <div style="width:${u(118)}; min-height:${u(138)}; background:#FFFDF7; border:${u(1.5)} dashed ${RED}; padding:${u(10)} ${u(8)}; display:flex; flex-direction:column; align-items:center; justify-content:space-between; text-align:center">
          <div style="font-size:${u(8)}; letter-spacing:${u(2)}; text-transform:uppercase; color:${RED}">${escapeHtml(labels.documentUpper)}</div>
          <div style="font-family:${FONTS.lora}; font-size:${u(30)}; font-style:italic; color:${BLUE}; line-height:1">✉</div>
          <div>
            <div style="font-size:${u(8)}; color:${MUTED}">${escapeHtml(labels.number)}</div>
            ${mono(escapeHtml(context.number), 12.5, 'font-weight:700; word-break:break-all')}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:${u(22)}; gap:${u(24)}">
    <div>
      <div style="display:inline-block; border:${u(2)} solid ${BLUE}; color:${BLUE}; padding:${u(4)} ${u(12)}; font-family:${FONTS.courier}; font-weight:700; font-size:${u(12)}; letter-spacing:${u(3)}">PAR AVION · PRIORITAIRE</div>
      <div style="margin-top:${u(14)}; font-size:${u(10.5)}; line-height:1.7">
        ${context.meta
          .map(
            (entry) =>
              `<div>${escapeHtml(entry.label)} : ${mono(escapeHtml(entry.value), 11.5, entry.strong ? `font-weight:700; color:${RED}` : '')}</div>`,
          )
          .join('')}
      </div>
    </div>
    <div style="width:${u(330)}; font-family:${FONTS.courier}; font-size:${u(13)}; line-height:1">
      <div style="font-family:${FONTS.lora}; font-size:${u(8.5)}; letter-spacing:${u(2)}; text-transform:uppercase; color:${MUTED}; margin-bottom:${u(4)}">${escapeHtml(labels.billedTo)}</div>
      ${[
        `<b>${escapeHtml(client.name)}</b>`,
        client.contactName ? escapeHtml(client.contactName) : '',
        ...client.addressLines.map(escapeHtml),
        client.vatNumber ? `TVA ${escapeHtml(client.vatNumber)}` : '',
      ]
        .filter(Boolean)
        .map((text) => `<div style="border-bottom:${u(1)} solid rgba(35,50,74,.35); padding:${u(8)} ${u(4)} ${u(4)}">${text}</div>`)
        .join('')}
    </div>
  </div>

  <div style="margin-top:${u(28)}; font-size:${u(12)}; font-style:italic">${escapeHtml(labels.document)} ${escapeHtml(labels.number)} ${escapeHtml(context.number)} —</div>

  <table style="width:100%; margin-top:${u(8)}; border-collapse:collapse; font-size:${u(10.5)}">
    <thead><tr style="font-family:${FONTS.courier}; font-size:${u(9.5)}; text-transform:uppercase; color:${MUTED}">
      <th style="text-align:left; font-weight:400; padding:${u(6)} 0; border-bottom:${u(1.5)} solid ${INK}">${escapeHtml(labels.designation)}</th>
      <th style="text-align:right; font-weight:400; padding:${u(6)} 0; border-bottom:${u(1.5)} solid ${INK}; width:${u(70)}">${escapeHtml(labels.quantity)}</th>
      <th style="text-align:right; font-weight:400; padding:${u(6)} 0; border-bottom:${u(1.5)} solid ${INK}; width:${u(100)}">${escapeHtml(labels.unitPrice)}</th>
      <th style="text-align:right; font-weight:400; padding:${u(6)} 0; border-bottom:${u(1.5)} solid ${INK}; width:${u(56)}">${escapeHtml(labels.vat)}</th>
      <th style="text-align:right; font-weight:400; padding:${u(6)} 0; border-bottom:${u(1.5)} solid ${INK}; width:${u(104)}">${escapeHtml(labels.totalHt)}</th>
    </tr></thead>
    <tbody>${context.lines
      .map(
        (line) => `<tr style="border-bottom:${u(1)} dashed rgba(35,50,74,.4)">
        <td style="padding:${u(8)} ${u(8)} ${u(8)} 0"><b>${escapeHtml(line.title)}</b>${line.description ? `<div style="font-size:${u(9.5)}; font-style:italic; color:${MUTED}">${escapeHtml(line.description)}</div>` : ''}</td>
        <td style="text-align:right; padding:${u(8)} 0; font-family:${FONTS.courier}">${quantityText(line)}</td>
        <td style="text-align:right; padding:${u(8)} 0; font-family:${FONTS.courier}">${escapeHtml(line.unitPrice)}</td>
        <td style="text-align:right; padding:${u(8)} 0; font-family:${FONTS.courier}; color:${MUTED}">${escapeHtml(line.vatRate)}</td>
        <td style="text-align:right; padding:${u(8)} 0; font-family:${FONTS.courier}; font-weight:700">${escapeHtml(line.totalHt)}</td>
      </tr>`,
      )
      .join('')}</tbody>
  </table>

  <div class="dc-keep" style="display:flex; gap:${u(22)}; margin-top:${u(20)}; align-items:flex-start">
    <div style="flex:1; font-size:${u(10)}; line-height:1.65">
      ${
        context.payment.terms || payment.length > 0
          ? `<div style="font-size:${u(8.5)}; letter-spacing:${u(2)}; text-transform:uppercase; color:${MUTED}">${escapeHtml(labels.payment)}</div>
      <div style="font-family:${FONTS.courier}">${joinLines([context.payment.terms, ...payment])}</div>`
          : ''
      }
      ${context.notes ? `<div style="margin-top:${u(12)}; font-style:italic; font-size:${u(11)}"><b style="color:${RED}">P.-S.</b> ${escapeHtml(context.notes)}</div>` : ''}
    </div>
    <div style="width:${u(300)}; border:${u(1.5)} solid ${INK}; background:#FFFDF7">
      <div style="background:${INK}; color:${PAPER}; font-family:${FONTS.courier}; font-size:${u(9)}; letter-spacing:${u(2)}; padding:${u(4)} ${u(10)}; text-transform:uppercase">Déclaration de valeur</div>
      <div style="padding:${u(6)} ${u(10)}; font-size:${u(10.5)}">
        ${totalsList(context)
          .filter((entry) => entry.kind !== 'final')
          .map(
            (entry) =>
              `<div style="display:flex; justify-content:space-between; padding:${u(3)} 0; ${entry.kind === 'ttc' ? 'font-weight:700;' : ''}"><span>${escapeHtml(entry.label)}</span>${mono(escapeHtml(entry.value), 11)}</div>`,
          )
          .join('')}
      </div>
      <div style="border-top:${u(1.5)} dashed ${INK}; padding:${u(8)} ${u(10)}; display:flex; justify-content:space-between; align-items:baseline; color:${RED}">
        <span style="font-weight:700; font-style:italic; font-size:${u(12)}">${escapeHtml(labels.amountDue)}</span>
        ${mono(escapeHtml(totals.amountDue), 18, 'font-weight:700')}
      </div>
    </div>
  </div>

  <div class="dc-spacer"></div>
  <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:${u(20)}">
    <div style="flex:1">
      <div style="height:${u(26)}; width:${u(240)}; background:repeating-linear-gradient(90deg, ${INK} 0 ${u(2)}, transparent ${u(2)} ${u(4)}, ${INK} ${u(4)} ${u(7)}, transparent ${u(7)} ${u(9)}, ${INK} ${u(9)} ${u(10)}, transparent ${u(10)} ${u(13)})"></div>
      ${mono(`${escapeHtml(context.number)} · FR`, 9, `letter-spacing:${u(2)}`)}
      ${context.legalMentions.length > 0 ? `<div style="font-size:${u(8.5)}; line-height:1.55; color:${MUTED}; margin-top:${u(8)}">${joinLines(context.legalMentions)}</div>` : ''}
    </div>
    ${qrSlot(context.qrSvg, 62)}
  </div>
</div>`;
}

export const template33: PdfTemplateDefinition = {
  id: '33',
  name: 'Courrier',
  description: 'Enveloppe par avion : liseré rouge et bleu, timbre dentelé, cachet de la poste et adresse tapée.',
  accent: '#C8352E',
  paper: '#FBF6EA',
  render,
  vocabulary: 'classic',
  category: 'creatif',
  ownsLegalIds: true,
};
