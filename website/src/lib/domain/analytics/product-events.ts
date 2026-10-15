import { supabase } from '@/lib/supabase';
import type { InvoiceCreationSource } from '@/types/invoice';

export type { InvoiceCreationSource };

/**
 * Suivi d'utilisation (espace administrateur « Activité utilisateurs »).
 *
 * Les événements passent par la RPC `track_product_event`, qui impose
 * l'utilisateur et l'heure côté base et vérifie chaque fait. Jamais d'audio,
 * de transcription ni de contenu de facture. Le suivi ne bloque jamais
 * l'utilisateur : toute erreur est ignorée.
 */

export type ClientProductEvent =
  | 'session_active'
  | 'voice_invoice_started'
  | 'voice_invoice_failed'
  | 'voice_invoice_saved'
  | 'invoice_creation_method';

const PLATFORM = 'web';

export function newVoiceAttemptId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function trackProductEvent(
  event: ClientProductEvent,
  options: {
    attemptId?: string | null;
    invoiceId?: string | null;
    method?: 'manual' | 'ai_import' | 'duplicate' | null;
    errorCode?: string | null;
  } = {},
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('track_product_event', {
      p_event: event,
      p_platform: PLATFORM,
      p_attempt_id: options.attemptId ?? null,
      p_invoice_id: options.invoiceId ?? null,
      p_method: options.method ?? null,
      p_error_code: options.errorCode ?? null,
    });
    return !error && data === true;
  } catch {
    return false;
  }
}

/** Méthode de création d'une facture qui vient d'être enregistrée. */
export async function trackInvoiceCreation(invoiceId: string, source: InvoiceCreationSource): Promise<void> {
  if (source.method === 'voice') {
    await trackProductEvent('voice_invoice_saved', { attemptId: source.attemptId, invoiceId });
    return;
  }
  await trackProductEvent('invoice_creation_method', { invoiceId, method: source.method });
}

let lastActivePing = 0;

/** Présence du jour (dédupliquée en base : une par utilisateur, plateforme et jour). */
export function trackSessionActive(): void {
  const now = Date.now();
  if (now - lastActivePing < 30 * 60 * 1000) return;
  lastActivePing = now;
  void trackProductEvent('session_active');
}
