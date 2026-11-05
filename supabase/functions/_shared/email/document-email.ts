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

/** Adresse sûre pour un lien d'e-mail (https uniquement). */
export function safeHttpsUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return /^https:\/\/[^\s"'<>]+$/.test(trimmed) ? trimmed : null;
}

function ctaButton(href: string, label: string, primary: boolean): string {
  const style = primary
    ? 'background:#4f46e5;color:#ffffff;'
    : 'background:#ffffff;color:#4f46e5;border:1px solid #c7d2fe;';
  return `<a href="${escapeHtml(href)}" style="${style}display:inline-block;padding:12px 18px;border-radius:10px;font-weight:600;text-decoration:none;margin:0 8px 8px 0;">${escapeHtml(label)}</a>`;
}

export function buildEmailContent(params: {
  documentType: DocumentType;
  documentNumber: string;
  clientName: string;
  companyName: string;
  customMessage?: string | null;
  /** Lien sécurisé vers le document (consultation, signature du devis). */
  documentUrl?: string | null;
  /** Lien de paiement en ligne de la facture, s'il existe. */
  paymentUrl?: string | null;
  /** Le PDF est-il joint au message ? */
  hasAttachment?: boolean;
}): EmailContent {
  const { documentType, documentNumber, clientName, companyName } = params;
  const isQuote = documentType === 'quote';
  const label = isQuote ? 'devis' : 'facture';
  const documentUrl = safeHttpsUrl(params.documentUrl);
  const paymentUrl = isQuote ? null : safeHttpsUrl(params.paymentUrl);
  const hasAttachment = params.hasAttachment !== false;
  const subject = `${isQuote ? 'Devis' : 'Facture'} ${documentNumber} — ${companyName}`;
  const intro = isQuote
    ? hasAttachment
      ? `Veuillez trouver ci-joint notre devis n° ${documentNumber}.`
      : `Voici notre devis n° ${documentNumber}.`
    : hasAttachment
      ? `Veuillez trouver ci-joint la facture n° ${documentNumber}.`
      : `Voici la facture n° ${documentNumber}.`;
  const closing =
    params.customMessage?.trim() ||
    (isQuote
      ? 'Nous restons à votre disposition pour toute question.'
      : 'Merci de procéder au règlement selon les conditions indiquées.');
  const linkLabel = isQuote ? 'Consulter et signer le devis' : 'Consulter la facture';
  const linkHint = isQuote
    ? 'Vous pouvez consulter le devis, le télécharger, puis l’accepter en le signant en ligne (téléphone ou ordinateur) ou le refuser.'
    : null;

  const text = [
    `Bonjour ${clientName},`,
    '',
    intro,
    closing,
    ...(documentUrl ? ['', `${linkLabel} : ${documentUrl}`] : []),
    ...(linkHint && documentUrl ? [linkHint] : []),
    ...(paymentUrl ? ['', `Payer en ligne : ${paymentUrl}`] : []),
    '',
    'Cordialement,',
    companyName,
  ].join('\n');

  const buttons = [
    documentUrl ? ctaButton(documentUrl, linkLabel, !paymentUrl) : '',
    paymentUrl ? ctaButton(paymentUrl, 'Payer en ligne', true) : '',
  ].join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
  <body style="margin:0;padding:24px;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1c1e;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;">
      <p style="margin:0 0 16px;">Bonjour ${escapeHtml(clientName)},</p>
      <p style="margin:0 0 12px;">${escapeHtml(intro)}</p>
      <p style="margin:0 0 20px;">${escapeHtml(closing)}</p>
      ${buttons ? `<div style="margin:0 0 12px;">${buttons}</div>` : ''}
      ${linkHint && documentUrl ? `<p style="margin:0 0 16px;color:#6b7280;font-size:13px;">${escapeHtml(linkHint)}</p>` : ''}
      ${hasAttachment ? `<p style="margin:0;color:#6b7280;font-size:13px;">Le ${escapeHtml(label)} est joint à ce message au format PDF.</p>` : ''}
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
