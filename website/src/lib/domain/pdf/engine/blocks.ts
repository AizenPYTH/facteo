import type { PaymentMethodId } from '@/types/payment-methods';
import { PAYMENT_METHOD_LABELS } from '@/types/payment-methods';
import { formatDate } from '@/lib/format/date';
import { formatDateTimeForPdf } from '@/lib/format/datetime';
import { formatPriceHT } from '@/lib/format/currency';
import { mapLineValueToTotals } from '@/lib/quotes/mappers';
import type { PdfClientInfo, PdfCompanyInfo, PdfDocumentInput, PdfDocumentLine } from '@/lib/pdf/engine/types';

function formatIban(value: string): string {
  return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
}

function formatVatRateLabel(value: string): string {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!normalized) {
    return '0 %';
  }
  return `${value.trim()} %`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatCompanyBlock(company: PdfCompanyInfo): string {
  const name = company.companyName || [company.firstName, company.lastName].filter(Boolean).join(' ');
  const address = [
    company.address,
    [company.postalCode, company.city].filter(Boolean).join(' '),
    company.country,
  ]
    .filter((value): value is string => Boolean(value))
    .map(escapeHtml)
    .join('<br/>');

  return `
    <div class="company-name">${escapeHtml(name)}</div>
    ${address ? `<div class="muted">${address}</div>` : ''}
    ${company.email ? `<div class="muted">${escapeHtml(company.email)}</div>` : ''}
    ${company.phone ? `<div class="muted">${escapeHtml(company.phone)}</div>` : ''}
    ${company.siret ? `<div class="muted">SIRET : ${escapeHtml(company.siret)}</div>` : ''}
    ${company.vatNumber ? `<div class="muted">N° TVA : ${escapeHtml(company.vatNumber)}</div>` : ''}
  `;
}

export function formatClientBlock(client: PdfClientInfo): string {
  const name =
    client.company?.trim() ||
    [client.firstName, client.lastName].filter(Boolean).join(' ') ||
    'Client';
  const address = [
    client.address,
    [client.postalCode, client.city].filter(Boolean).join(' '),
    client.country,
  ]
    .filter((value): value is string => Boolean(value))
    .map(escapeHtml)
    .join('<br/>');

  return `
    <div class="client-name">${escapeHtml(name)}</div>
    ${address ? `<div class="muted">${address}</div>` : ''}
    ${client.email ? `<div class="muted">${escapeHtml(client.email)}</div>` : ''}
    ${client.vatNumber ? `<div class="muted">N° TVA : ${escapeHtml(client.vatNumber)}</div>` : ''}
  `;
}

export function buildLineRows(lines: PdfDocumentLine[]): string {
  return lines
    .map((line) => {
      const totals = mapLineValueToTotals(line);
      const discount = Number(line.discountPercent.replace(',', '.')) || 0;

      return `
        <tr>
          <td>${escapeHtml(line.description)}</td>
          <td class="num">${escapeHtml(line.quantity)}</td>
          <td>${escapeHtml(line.unit)}</td>
          <td class="num">${formatPriceHT(Number(line.unitPrice.replace(',', '.')) || 0)}</td>
          <td class="num">${discount > 0 ? `${discount} %` : '—'}</td>
          <td class="num">${formatVatRateLabel(line.vatRate)}</td>
          <td class="num">${formatPriceHT(totals.lineTotalHt)}</td>
        </tr>
      `;
    })
    .join('');
}

export function buildVatSummaryRows(lines: PdfDocumentLine[]): string {
  const buckets = new Map<number, { ht: number; vat: number }>();

  lines.forEach((line) => {
    const totals = mapLineValueToTotals(line);
    const rate = Number(line.vatRate.replace(',', '.')) || 0;
    const current = buckets.get(rate) ?? { ht: 0, vat: 0 };
    buckets.set(rate, {
      ht: current.ht + totals.lineTotalHt,
      vat: current.vat + totals.lineVat,
    });
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(
      ([rate, values]) => `
      <tr>
        <td>TVA ${rate.toFixed(2).replace('.', ',')} %</td>
        <td class="num">${formatPriceHT(values.ht)}</td>
        <td class="num">${formatPriceHT(values.vat)}</td>
      </tr>
    `,
    )
    .join('');
}

export function buildDocumentMeta(input: PdfDocumentInput): {
  title: string;
  secondaryDateLabel: string;
} {
  if (input.kind === 'quote') {
    return {
      title: 'DEVIS',
      secondaryDateLabel: 'Validité',
    };
  }

  return {
    title: 'FACTURE',
    secondaryDateLabel: 'Échéance',
  };
}

/**
 * Facture dont le solde est déjà nul : vente encaissée avant émission du
 * document (marketplace, paiement à la commande, acompte total…).
 *
 * Le montant restant dû est calculé à partir des paiements enregistrés ; il
 * n'est renseigné que pour une facture réelle, pas pour un brouillon en cours
 * de composition, d'où le test de type.
 */
function isSettledInvoice(input: PdfDocumentInput): boolean {
  return (
    input.kind === 'invoice' &&
    typeof input.totals.amountDue === 'number' &&
    input.totals.amountDue <= 0.01
  );
}

export function buildPaymentSection(input: PdfDocumentInput): string {
  const paymentTermsDays = input.settings?.paymentTermsDays ?? 30;
  const { company } = input;
  const methods = company.paymentMethods ?? [];
  const iban = company.iban?.trim() ?? '';
  const bic = company.bic?.trim() ?? '';

  // Réclamer un délai de paiement, un IBAN ou un QR de virement sur une facture
  // déjà réglée invite l'acheteur à payer une seconde fois.
  if (isSettledInvoice(input)) {
    return `
    <div class="payment">
      <h3>Règlement</h3>
      <div><strong>Facture payée.</strong> Aucun règlement n’est attendu.</div>
    </div>
  `;
  }

  if (methods.length === 0 && !iban && !bic) {
    return '';
  }

  const methodLines = methods
    .map((methodId: PaymentMethodId) => `<div>• ${escapeHtml(PAYMENT_METHOD_LABELS[methodId])}</div>`)
    .join('');

  const bankBlock =
    iban || bic
      ? `
          ${iban ? `<div><strong>IBAN</strong> ${escapeHtml(formatIban(iban))}</div>` : ''}
          ${bic ? `<div><strong>BIC</strong> ${escapeHtml(bic)}</div>` : ''}
        `
      : '';

  const title = input.kind === 'invoice' ? 'Conditions de paiement' : 'Modalités de paiement';
  const termsLine =
    input.kind === 'invoice'
      ? `<div>Paiement sous ${paymentTermsDays} jours.</div>`
      : `<div>Devis valable selon les dates indiquées.</div>`;

  return `
    <div class="payment">
      <h3>${title}</h3>
      <div class="payment-grid">
        <div>
          ${termsLine}
          ${methodLines ? `<div class="payment-methods">${methodLines}</div>` : ''}
          ${bankBlock}
        </div>
        ${
          input.kind === 'invoice' && input.showPaymentQr !== false
            ? '<div class="qr-placeholder">QR Code paiement<br/>(bientôt disponible)</div>'
            : ''
        }
      </div>
    </div>
  `;
}

export function buildClientSignatureSection(
  signature: { url: string; signedAt: string } | null | undefined,
): string {
  if (!signature?.url) {
    return '';
  }

  return `
    <div class="client-signature">
      <div class="muted" style="margin-bottom:6px">Signature client</div>
      <img src="${escapeHtml(signature.url)}" alt="Signature client" />
      <div class="muted" style="margin-top:8px">Signé électroniquement le ${escapeHtml(formatDateTimeForPdf(signature.signedAt))}</div>
    </div>
  `;
}

export function buildSignatureSection(company: PdfCompanyInfo): string {
  if (!company.signatureUrl) {
    return '';
  }

  return `
    <div class="signature">
      <div class="muted" style="margin-bottom:6px">Signature</div>
      <img src="${escapeHtml(company.signatureUrl)}" alt="Signature" />
    </div>
  `;
}

export function formatSecondaryDate(input: PdfDocumentInput): string {
  return input.dueOrValidUntil ? formatDate(input.dueOrValidUntil) : '—';
}

export function formatIssuedDate(input: PdfDocumentInput): string {
  return input.issuedAt ? formatDate(input.issuedAt) : '—';
}

export function buildFooter(input: PdfDocumentInput): string {
  const footer =
    input.kind === 'quote'
      ? input.settings?.quoteFooter?.trim() || 'Merci pour votre confiance.'
      : input.settings?.invoiceFooter?.trim() || 'Merci pour votre confiance.';

  return escapeHtml(footer);
}
