import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * Envoi réel d'un document au client, via l'Edge Function `send-document-email`
 * (Resend côté serveur).
 *
 * Le succès signifie que Resend a accepté le message, pas qu'un client de
 * messagerie s'est ouvert. La clé API n'existe que dans les secrets Supabase.
 */

export type SendDocumentType = 'quote' | 'invoice';

export type SendDocumentReason =
  | 'recipient'
  | 'not-configured'
  | 'provider'
  | 'network'
  | 'auth'
  | 'unknown';

export class SendDocumentEmailError extends Error {
  readonly reason: SendDocumentReason;

  constructor(message: string, reason: SendDocumentReason) {
    super(message);
    this.name = 'SendDocumentEmailError';
    this.reason = reason;
  }

  /**
   * Proposer d'ouvrir le client de messagerie n'a de sens que si le problème
   * vient de l'envoi serveur. Sans destinataire, ou sans session valide, cela
   * ne réglerait rien.
   */
  get allowsMailFallback(): boolean {
    return this.reason !== 'recipient' && this.reason !== 'auth';
  }
}

function reasonFromStatus(status: number): SendDocumentReason {
  if (status === 401 || status === 403) return 'auth';
  if (status === 422) return 'recipient';
  if (status === 503) return 'not-configured';
  if (status >= 500) return 'provider';
  return 'unknown';
}

/** Blob → base64 sans préfixe data:, en évitant de saturer la pile d'appels. */
export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < buffer.length; i += chunk) {
    binary += String.fromCharCode(...buffer.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export type SendDocumentEmailResult = {
  sent: true;
  recipient: string;
  providerId: string | null;
};

export async function sendDocumentEmail(params: {
  documentType: SendDocumentType;
  documentId: string;
  pdfBlob: Blob;
  pdfFileName: string;
  message?: string;
}): Promise<SendDocumentEmailResult> {
  const supabase = getSupabaseBrowserClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new SendDocumentEmailError('Session expirée. Reconnectez-vous.', 'auth');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    throw new SendDocumentEmailError('Supabase n’est pas configuré.', 'not-configured');
  }

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/send-document-email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentType: params.documentType,
        documentId: params.documentId,
        pdfBase64: await blobToBase64(params.pdfBlob),
        pdfFileName: params.pdfFileName,
        message: params.message,
      }),
    });
  } catch {
    throw new SendDocumentEmailError(
      'Le serveur d’envoi est injoignable. Vérifiez votre connexion.',
      'network',
    );
  }

  const body = (await response.json().catch(() => null)) as
    | { error?: string; recipientEmail?: string; providerMessageId?: string }
    | null;

  if (!response.ok) {
    throw new SendDocumentEmailError(
      body?.error || 'L’envoi de l’e-mail a échoué.',
      reasonFromStatus(response.status),
    );
  }

  return {
    sent: true,
    recipient: body?.recipientEmail ?? '',
    providerId: body?.providerMessageId ?? null,
  };
}
