import { composeDocumentEmail } from '@/lib/email/composer';
import { buildReminderEmailTemplate } from '@/lib/email/templates';
import { formatDate } from '@/lib/format/date';
import { formatPriceTTC } from '@/lib/format/currency';
import { buildInvoicePdfHtml } from '@/lib/pdf/document-pdf';
import { generateHtmlAsPdf } from '@/lib/pdf/share';
import { fetchInvoiceById } from '@/lib/supabase/invoices';
import type { DataScope } from '@/types/tenant';
import { canMarkInvoiceAsPaid, type Invoice } from '@/types/invoice';

export function canRemindInvoice(
  invoice: Pick<Invoice, 'status' | 'clientEmail'>,
): boolean {
  return canMarkInvoiceAsPaid(invoice.status) && Boolean(invoice.clientEmail?.trim());
}

export type RemindInvoiceResult = 'sent' | 'cancelled' | 'failed';

/**
 * Opens the native mail composer with a payment-reminder template + PDF.
 * Logs to sent_documents on successful send (no schema change).
 */
export async function remindInvoiceByMail(input: {
  scope: DataScope;
  userId: string;
  invoiceId: string;
  companyName?: string | null;
  authEmail?: string | null;
}): Promise<RemindInvoiceResult> {
  const detail = await fetchInvoiceById(input.scope, input.invoiceId);

  if (!detail) {
    throw new Error('Invoice not found.');
  }

  if (!canRemindInvoice(detail)) {
    throw new Error(
      detail.clientEmail?.trim()
        ? 'Cette facture ne peut pas être relancée.'
        : 'Ajoutez une adresse e-mail au client pour relancer.',
    );
  }

  const html = await buildInvoicePdfHtml(input.scope, detail, input.authEmail);
  const pdf = await generateHtmlAsPdf(html, `${detail.number}.pdf`);
  const template = buildReminderEmailTemplate({
    documentNumber: detail.number,
    clientName: detail.clientName || 'Client',
    companyName: input.companyName ?? undefined,
    amountLabel: formatPriceTTC(detail.amountDue > 0 ? detail.amountDue : detail.totalTtc),
    dueAtLabel: detail.dueAt ? formatDate(detail.dueAt) : null,
  });

  try {
    await composeDocumentEmail({
      userId: input.userId,
      documentType: 'invoice',
      documentId: detail.id,
      documentNumber: detail.number,
      recipientEmail: detail.clientEmail ?? '',
      subject: template.subject,
      body: template.body,
      pdfUri: pdf.uri,
      pdfFileName: pdf.fileName,
      customMessage: template.body,
    });
    return 'sent';
  } catch (error) {
    // Composer cancel is silent in composeDocumentEmail (returns without throw).
    // Other errors propagate.
    throw error;
  }
}
