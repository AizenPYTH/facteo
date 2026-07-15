import {
  buildDocumentMeta,
  buildFooter,
  buildLineRows,
  buildPaymentSection,
  buildClientSignatureSection,
  buildSignatureSection,
  buildVatSummaryRows,
  escapeHtml,
  formatClientBlock,
  formatCompanyBlock,
  formatIssuedDate,
  formatSecondaryDate,
} from '@/lib/pdf/engine/blocks';
import { resolvePdfTemplate } from '@/lib/pdf/engine/templates/registry';
import { getTemplatePdfStyles } from '@/lib/pdf/engine/templates/styles';
import type { PdfDocumentInput } from '@/lib/pdf/engine/types';
import { formatPriceHT } from '@/lib/format/currency';

function logoClass(position: string): string {
  if (position === 'center') return 'logo logo-center';
  if (position === 'right') return 'logo logo-right';
  return 'logo';
}

function buildHeader(input: PdfDocumentInput, meta: ReturnType<typeof buildDocumentMeta>): string {
  const template = resolvePdfTemplate(input.templateId);
  const { company } = input;
  const logoHtml = company.logoUrl
    ? `<img class="${logoClass(template.logoPosition)}" src="${escapeHtml(company.logoUrl)}" alt="Logo" />`
    : '';

  const metaBlock = `
    <div class="meta">
      <h1 class="doc-title">${meta.title}</h1>
      <div><strong>N°</strong> ${escapeHtml(input.number)}</div>
      <div><strong>Date</strong> ${formatIssuedDate(input)}</div>
      <div><strong>${meta.secondaryDateLabel}</strong> ${formatSecondaryDate(input)}</div>
    </div>`;

  const companyBlock = `<div>${logoHtml}${formatCompanyBlock(company)}</div>`;

  if (template.layout === 'banner' || template.layout === 'stripe' || template.headerStyle === 'band') {
    return `
      <div class="header-band">
        <div class="header ${template.layout === 'centered' ? 'header-center' : ''}">
          ${template.logoPosition === 'right' ? metaBlock + companyBlock : companyBlock + metaBlock}
        </div>
      </div>`;
  }

  if (template.layout === 'centered') {
    return `
      <div class="header header-center">
        ${logoHtml}
        ${formatCompanyBlock(company)}
        ${metaBlock}
      </div>`;
  }

  if (template.logoPosition === 'right') {
    return `<div class="header">${metaBlock}${companyBlock}</div>`;
  }

  return `<div class="header">${companyBlock}${metaBlock}</div>`;
}

function buildParties(input: PdfDocumentInput): string {
  const template = resolvePdfTemplate(input.templateId);
  const { company, client } = input;

  if (!template.showPartyCards) {
    return `
      <div class="parties-inline">
        <div class="party"><h3>Émetteur</h3>${formatCompanyBlock(company)}</div>
        <div class="party"><h3>Client</h3>${formatClientBlock(client)}</div>
      </div>`;
  }

  return `
    <div class="parties">
      <div class="party"><h3>Émetteur</h3>${formatCompanyBlock(company)}</div>
      <div class="party"><h3>Client</h3>${formatClientBlock(client)}</div>
    </div>`;
}

function buildMainContent(input: PdfDocumentInput, meta: ReturnType<typeof buildDocumentMeta>): string {
  const { totals } = input;
  const amountDue = totals.amountDue ?? totals.totalTtc;
  const showAmountDue = input.kind === 'invoice' && amountDue < totals.totalTtc - 0.01;

  return `
    ${buildHeader(input, meta)}
    ${buildParties(input)}
    <table class="lines-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="num">Qté</th>
          <th>Unité</th>
          <th class="num">P.U. HT</th>
          <th class="num">Remise</th>
          <th class="num">TVA</th>
          <th class="num">Total HT</th>
        </tr>
      </thead>
      <tbody>${buildLineRows(input.lines)}</tbody>
    </table>
    <div class="totals-wrap">
      <div class="totals">
        <div class="totals-row"><span>Total HT</span><span>${formatPriceHT(totals.subtotalHt)}</span></div>
        <div class="totals-row"><span>TVA</span><span>${formatPriceHT(totals.totalVat)}</span></div>
        <div class="totals-row total"><span>Total TTC</span><span>${formatPriceHT(totals.totalTtc)}</span></div>
        ${showAmountDue ? `<div class="totals-row due"><span>Reste à payer</span><span>${formatPriceHT(amountDue)}</span></div>` : ''}
      </div>
    </div>
    <table class="vat-table">
      <thead>
        <tr><th>Taux</th><th class="num">Base HT</th><th class="num">Montant TVA</th></tr>
      </thead>
      <tbody>${buildVatSummaryRows(input.lines)}</tbody>
    </table>
    ${buildPaymentSection(input)}
    ${input.notes?.trim() ? `<div class="notes"><strong>Notes</strong><br/>${escapeHtml(input.notes.trim())}</div>` : ''}
    ${buildSignatureSection(input.company)}
    ${buildClientSignatureSection(input.clientSignature)}
    <div class="footer">${buildFooter(input)}</div>`;
}

export function renderTemplatedDocumentPdfHtml(input: PdfDocumentInput): string {
  const template = resolvePdfTemplate(input.templateId);
  const meta = buildDocumentMeta(input);

  const body =
    template.layout === 'sidebar'
      ? `
        <div class="sidebar-layout">
          <div class="sidebar-panel">
            ${input.company.logoUrl ? `<img class="logo" src="${escapeHtml(input.company.logoUrl)}" alt="Logo" />` : ''}
            ${formatCompanyBlock(input.company)}
          </div>
          <div class="sidebar-content">
            <h1 class="doc-title">${meta.title}</h1>
            <div class="meta" style="text-align:left;margin-bottom:16px;">
              <div><strong>N°</strong> ${escapeHtml(input.number)}</div>
              <div><strong>Date</strong> ${formatIssuedDate(input)}</div>
            </div>
            <div class="party" style="margin-bottom:16px;"><h3>Client</h3>${formatClientBlock(input.client)}</div>
            ${buildMainContent({ ...input, templateId: template.id }, meta).replace(buildHeader(input, meta), '').replace(buildParties(input), '')}
          </div>
        </div>`
      : buildMainContent(input, meta);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <style>${getTemplatePdfStyles(template)}</style>
</head>
<body>
  <div class="page">${body}</div>
</body>
</html>`;
}
