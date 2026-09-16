import * as FileSystem from 'expo-file-system/legacy';

import { supabase } from '@/lib/supabase';
import type { SentDocumentType } from '@/types/sent-document';

/**
 * Envoi réel du document au client, depuis `factures@inveq.fr`, via Resend.
 *
 * L'appel passe par l'Edge Function `send-document-email` : la clé Resend reste
 * dans les secrets Supabase et ne transite jamais par l'application.
 */

export type SendDocumentEmailInput = {
  documentType: SentDocumentType;
  documentId: string;
  pdfUri: string;
  pdfFileName: string;
  message?: string;
};

export type SendDocumentEmailResult = {
  providerMessageId: string;
  recipientEmail: string;
};

/**
 * Raison d'échec, pour que l'interface sache quoi proposer :
 * - `recipient` : l'adresse du client manque → corriger la fiche client, pas de repli utile ;
 * - `not-configured` / `provider` / `network` : l'envoi automatique est indisponible → proposer Mail ;
 * - `auth` : session expirée.
 */
export type SendDocumentEmailFailure =
  | 'recipient'
  | 'not-configured'
  | 'provider'
  | 'network'
  | 'auth'
  | 'unknown';

export class SendDocumentEmailError extends Error {
  constructor(
    message: string,
    readonly reason: SendDocumentEmailFailure,
  ) {
    super(message);
    this.name = 'SendDocumentEmailError';
  }

  /** Un repli « ouvrir l'app Mail » a-t-il un sens pour cet échec ? */
  get allowsMailFallback(): boolean {
    return this.reason !== 'recipient' && this.reason !== 'auth';
  }
}

function resolveEndpoint(): string | null {
  const explicit = process.env.EXPO_PUBLIC_SEND_DOCUMENT_EMAIL_URL?.trim();

  if (explicit) {
    return explicit;
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();

  if (!supabaseUrl) {
    return null;
  }

  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/send-document-email`;
}

export function isServerEmailConfigured(): boolean {
  return Boolean(resolveEndpoint());
}

/**
 * Plafond accepté par l'Edge Function, exprimé en octets de fichier.
 *
 * Elle refuse au-delà de 12 000 000 caractères de base64 (HTTP 413). Le base64
 * gonfle de 4/3 : on repasse donc à la taille du fichier pour pouvoir trancher
 * avant lecture, des deux côtés avec la même limite.
 */
const MAX_PDF_BASE64_LENGTH = 12_000_000;
const MAX_PDF_BYTES = Math.floor((MAX_PDF_BASE64_LENGTH * 3) / 4);

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export async function sendDocumentEmail(
  input: SendDocumentEmailInput,
): Promise<SendDocumentEmailResult> {
  const endpoint = resolveEndpoint();

  if (!endpoint) {
    throw new SendDocumentEmailError(
      'L’envoi automatique n’est pas configuré.',
      'not-configured',
    );
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new SendDocumentEmailError('Session expirée. Reconnectez-vous.', 'auth');
  }

  // Le poids est vérifié AVANT lecture.
  //
  // Envoyer le PDF fait vivre trois copies du même contenu dans la mémoire JS :
  // la chaîne base64, celle produite par `JSON.stringify`, puis le corps de la
  // requête. Sur un document lourd — un logo en haute définition suffit — cela
  // représente plusieurs dizaines de méga-octets d'un coup, et l'application
  // peut être tuée par le système avant même d'avoir joint le serveur, qui
  // aurait de toute façon refusé au-delà de `MAX_PDF_BASE64_LENGTH`.
  let fileSize = 0;

  try {
    const info = await FileSystem.getInfoAsync(input.pdfUri);

    if (!info.exists) {
      throw new SendDocumentEmailError('PDF introuvable sur l’appareil.', 'unknown');
    }

    fileSize = info.size ?? 0;
  } catch (error) {
    if (error instanceof SendDocumentEmailError) {
      throw error;
    }

    throw new SendDocumentEmailError('PDF introuvable sur l’appareil.', 'unknown');
  }

  if (fileSize > MAX_PDF_BYTES) {
    throw new SendDocumentEmailError(
      `Le PDF pèse ${formatMegabytes(fileSize)} : au-delà de ${formatMegabytes(
        MAX_PDF_BYTES,
      )} il ne peut pas être envoyé par e-mail. Allégez le logo de l’entreprise, puis réessayez.`,
      'provider',
    );
  }

  let pdfBase64: string;

  try {
    pdfBase64 = await FileSystem.readAsStringAsync(input.pdfUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch {
    throw new SendDocumentEmailError('PDF introuvable sur l’appareil.', 'unknown');
  }

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentType: input.documentType,
        documentId: input.documentId,
        pdfBase64,
        pdfFileName: input.pdfFileName,
        message: input.message,
      }),
    });
  } catch {
    throw new SendDocumentEmailError(
      'Connexion indisponible. Vérifiez votre accès Internet.',
      'network',
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | { sent?: boolean; providerMessageId?: string; recipientEmail?: string; error?: string; code?: string }
    | null;

  if (!response.ok || !payload?.sent || !payload.providerMessageId) {
    throw new SendDocumentEmailError(
      payload?.error || 'L’envoi automatique a échoué.',
      resolveFailureReason(response.status, payload?.code),
    );
  }

  return {
    providerMessageId: payload.providerMessageId,
    recipientEmail: payload.recipientEmail ?? '',
  };
}

function resolveFailureReason(status: number, code?: string): SendDocumentEmailFailure {
  if (code === 'recipient') {
    return 'recipient';
  }

  if (status === 401 || status === 403) {
    return 'auth';
  }

  if (status === 503) {
    return 'not-configured';
  }

  if (status === 502 || code === 'provider') {
    return 'provider';
  }

  return 'unknown';
}
