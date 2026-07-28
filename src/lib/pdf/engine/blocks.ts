import type { PaymentMethodId } from '@/types/payment-methods';
import { PAYMENT_METHOD_LABELS } from '@/types/payment-methods';
import { formatDate } from '@/lib/format/date';
import { formatDateTimeForPdf } from '@/lib/format/datetime';
import { formatPriceHT } from '@/lib/format/currency';
import { getLegalMentionForRegime } from '@/lib/invoices/legal-mentions';
import { mapLineValueToTotals } from '@/lib/quotes/mappers';
import type { PdfClientInfo, PdfCompanyInfo, PdfDocumentInput, PdfDocumentLine } from '@/lib/pdf/engine/types';

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
          <td class="num">${line.vatRate} %</td>
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

export function buildPaymentSection(input: PdfDocumentInput): string {
  const paymentTermsDays = input.settings?.paymentTermsDays ?? 30;
  const { company } = input;
  const methods = company.paymentMethods ?? [];

  if (methods.length === 0 && !company.iban && !company.bic) {
    return '';
  }

  const methodLines = methods
    .map((methodId: PaymentMethodId) => `<div>• ${escapeHtml(PAYMENT_METHOD_LABELS[methodId])}</div>`)
    .join('');

  const bankBlock =
    methods.includes('bank_transfer') && (company.iban || company.bic)
      ? `
          ${company.iban ? `<div><strong>IBAN</strong> ${escapeHtml(company.iban)}</div>` : ''}
          ${company.bic ? `<div><strong>BIC</strong> ${escapeHtml(company.bic)}</div>` : ''}
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

  if (input.kind !== 'invoice') {
    return escapeHtml(footer);
  }

  const legal = getLegalMentionForRegime(input.vatRegime);
  const combined = [footer, legal].filter(Boolean).join(' — ');

  return escapeHtml(combined);
}
