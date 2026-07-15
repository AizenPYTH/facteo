import { fetchClientById } from '@/lib/supabase/clients';
import { fetchSettings, computeDueDate, computeValidUntil } from '@/lib/supabase/settings';
import {
  renderDocumentPdfHtml,
  type PdfClientInfo,
  type PdfDocumentInput,
  type PdfDocumentLine,
} from '@/lib/pdf/engine';
import { inlinePdfCompanyImages } from '@/lib/pdf/inline-images';
import { resolvePdfCompanyInfo } from '@/lib/domain/pdf/document-pdf';
import { calculateLineTotals } from '@/lib/calculations/totals';
import type { Client } from '@/types/client';
import type { DataScope } from '@/types/tenant';

export type DraftLineInput = {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
  discountPercent: string;
};

export type DraftDocumentInput = {
  kind: 'invoice' | 'quote';
  clientId: string;
  lines: DraftLineInput[];
  notes: string;
  templateId: string;
};

function parseDecimal(value: string): number {
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapClientToPdf(client: Client): PdfClientInfo {
  return {
    lastName: client.lastName,
    firstName: client.firstName,
    company: client.company,
    email: client.email,
    phone: client.phone,
    address: client.address,
    postalCode: client.postalCode,
    city: client.city,
    country: client.country,
    vatNumber: client.vatNumber,
  };
}

function emptyClient(): PdfClientInfo {
  return {
    lastName: '',
    firstName: '',
    company: null,
    email: null,
    phone: null,
    address: null,
    postalCode: null,
    city: null,
    country: null,
    vatNumber: null,
  };
}

function computeDraftTotals(lines: DraftLineInput[]) {
  let subtotalHt = 0;
  let totalVat = 0;

  for (const line of lines) {
    if (!line.description.trim()) continue;
    const result = calculateLineTotals(
      parseDecimal(line.quantity),
      parseDecimal(line.unitPrice),
      parseDecimal(line.vatRate),
      parseDecimal(line.discountPercent),
    );
    subtotalHt += result.lineTotalHt;
    totalVat += result.lineVat;
  }

  const totalTtc = Math.round((subtotalHt + totalVat + Number.EPSILON) * 100) / 100;

  return { subtotalHt, totalVat, totalTtc, amountDue: totalTtc };
}

export async function buildDraftPdfHtml(
  scope: DataScope,
  draft: DraftDocumentInput,
  authEmail?: string | null,
): Promise<string> {
  const [company, settings, client] = await Promise.all([
    resolvePdfCompanyInfo(scope, authEmail),
    fetchSettings(scope),
    draft.clientId ? fetchClientById(scope, draft.clientId) : null,
  ]);

  const validLines: PdfDocumentLine[] = draft.lines
    .filter((line) => line.description.trim())
    .map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.unitPrice,
      vatRate: line.vatRate,
      discountPercent: line.discountPercent,
    }));

  const totals = computeDraftTotals(draft.lines);
  const now = new Date().toISOString();
  const prefix =
    draft.kind === 'invoice'
      ? (settings?.invoicePrefix ?? 'FAC')
      : (settings?.quotePrefix ?? 'DEV');
  const previewNumber = `${prefix}-APERÇU`;

  const dueOrValidUntil =
    draft.kind === 'invoice'
      ? computeDueDate(settings?.paymentTermsDays ?? 30)
      : computeValidUntil(settings?.quoteValidityDays ?? 30);

  const input: PdfDocumentInput = {
    kind: draft.kind,
    number: previewNumber,
    issuedAt: now,
    dueOrValidUntil,
    notes: draft.notes.trim() || null,
    lines: validLines.length > 0 ? validLines : [
      {
        description: '—',
        quantity: '1',
        unit: 'unité',
        unitPrice: '0',
        vatRate: '20',
        discountPercent: '0',
      },
    ],
    totals,
    company: await inlinePdfCompanyImages(company),
    client: client ? mapClientToPdf(client) : emptyClient(),
    settings,
    showPaymentQr: draft.kind === 'invoice',
    clientSignature: null,
    templateId: draft.templateId,
  };

  return renderDocumentPdfHtml(input);
}
