/**
 * Logique pure de l'envoi d'un document par e-mail.
 *
 * Isolée de `send-document-email/index.ts` pour être testable sans réseau
 * (`deno test`), comme les modules SUPER PDP partagés.
 */

export type DocumentType = 'quote' | 'invoice';

export function isEmail(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function sanitizeFileName(value: string | undefined | null, fallback: string): string {
  const candidate = (value ?? '').trim() || fallback;
  const withExtension = candidate.toLowerCase().endsWith('.pdf') ? candidate : `${candidate}.pdf`;

  return withExtension.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * `clients.name` stocke « Nom, Prénom » pour le tri alphabétique
 * (voir `src/lib/clients/name.ts`). L'e-mail s'adresse au client en « Prénom Nom ».
 */
export function resolveClientName(
  company: string | null | undefined,
  storedName: string | null | undefined,
): string {
  const companyName = company?.trim();

  if (companyName) {
    return companyName;
  }

  const trimmed = storedName?.trim() ?? '';

  if (!trimmed) {
    return 'Madame, Monsieur';
  }

  const commaIndex = trimmed.indexOf(', ');

  if (commaIndex === -1) {
    return trimmed;
  }

  const lastName = trimmed.slice(0, commaIndex).trim();
  const firstName = trimmed.slice(commaIndex + 2).trim();

  return [firstName, lastName].filter(Boolean).join(' ') || trimmed;
}

export type EmailContent = { subject: string; text: string; html: string };

export function buildEmailContent(params: {
  documentType: DocumentType;
  documentNumber: string;
  clientName: string;
  companyName: string;
  customMessage?: string | null;
}): EmailContent {
  const { documentType, documentNumber, clientName, companyName } = params;
  const isQuote = documentType === 'quote';
  const label = isQuote ? 'devis' : 'facture';
  const subject = `${isQuote ? 'Devis' : 'Facture'} ${documentNumber} — ${companyName}`;
  const intro = isQuote
    ? `Veuillez trouver ci-joint notre devis n° ${documentNumber}.`
    : `Veuillez trouver ci-joint la facture n° ${documentNumber}.`;
  const closing =
    params.customMessage?.trim() ||
    (isQuote
      ? 'Nous restons à votre disposition pour toute question.'
      : 'Merci de procéder au règlement selon les conditions indiquées.');

  const text = [
    `Bonjour ${clientName},`,
    '',
    intro,
    closing,
    '',
    'Cordialement,',
    companyName,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="fr">
  <body style="margin:0;padding:24px;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1c1e;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;">
      <p style="margin:0 0 16px;">Bonjour ${escapeHtml(clientName)},</p>
      <p style="margin:0 0 12px;">${escapeHtml(intro)}</p>
      <p style="margin:0 0 20px;">${escapeHtml(closing)}</p>
      <p style="margin:0;color:#6b7280;font-size:13px;">Le ${escapeHtml(label)} est joint à ce message au format PDF.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="margin:0;">Cordialement,<br/><strong>${escapeHtml(companyName)}</strong></p>
    </div>
  </body>
</html>`;

  return { subject, text, html };
}

export function buildResendPayload(params: {
  fromName: string;
  fromAddress: string;
  recipientEmail: string;
  replyTo?: string | null;
  content: EmailContent;
  fileName: string;
  pdfBase64: string;
}): Record<string, unknown> {
  const { fromName, fromAddress, recipientEmail, replyTo, content, fileName, pdfBase64 } = params;

  return {
    from: `${fromName} <${fromAddress}>`,
    to: [recipientEmail],
    // L'entreprise émettrice reçoit les réponses du client, pas INVEQ.
    ...(isEmail(replyTo) ? { reply_to: replyTo } : {}),
    subject: content.subject,
    text: content.text,
    html: content.html,
    attachments: [{ filename: fileName, content: pdfBase64 }],
  };
}
