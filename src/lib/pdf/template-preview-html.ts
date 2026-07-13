import { renderDocumentPdfHtml } from '@/lib/pdf/engine';
import type { PdfDocumentInput } from '@/lib/pdf/engine/types';
import { resolvePdfCompanyInfo } from '@/lib/pdf/document-pdf';
import type { DataScope } from '@/types/tenant';

function buildSampleDocumentInput(
  company: Awaited<ReturnType<typeof resolvePdfCompanyInfo>>,
  kind: 'invoice' | 'quote',
  templateId: string,
): PdfDocumentInput {
  return {
    kind,
    number: kind === 'invoice' ? 'FAC-2026-0042' : 'DEV-2026-0018',
    issuedAt: new Date().toISOString(),
    dueOrValidUntil: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    notes: kind === 'invoice' ? 'Merci pour votre confiance.' : null,
    lines: [
      {
        description: 'Prestation de rénovation — main d’œuvre',
        quantity: '12',
        unit: 'h',
        unitPrice: '65',
        vatRate: '20',
        discountPercent: '0',
      },
      {
        description: 'Fournitures et matériaux',
        quantity: '1',
        unit: 'forfait',
        unitPrice: '480',
        vatRate: '20',
        discountPercent: '0',
      },
    ],
    totals: {
      subtotalHt: 1260,
      totalVat: 252,
      totalTtc: 1512,
      amountDue: kind === 'invoice' ? 1512 : undefined,
    },
    company,
    client: {
      firstName: 'Marie',
      lastName: 'Dupont',
      company: 'Dupont Rénovation',
      email: 'marie@dupont.fr',
      phone: '06 12 34 56 78',
      address: '12 rue de la Paix',
      postalCode: '75002',
      city: 'Paris',
      country: 'France',
      vatNumber: null,
    },
    showPaymentQr: kind === 'invoice',
    clientSignature: null,
    templateId,
  };
}

export async function buildTemplatePreviewHtml(
  scope: DataScope,
  templateId: string,
  kind: 'invoice' | 'quote',
  authEmail?: string | null,
): Promise<string> {
  const company = await resolvePdfCompanyInfo(scope, authEmail);
  const input = buildSampleDocumentInput(company, kind, templateId);
  return renderDocumentPdfHtml(input);
}
