import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

/**
 * Suivi d'utilisation de la création vocale, écrit côté serveur dans
 * public.product_events. Seuls l'utilisateur, l'heure, la plateforme,
 * l'identifiant de tentative, le résultat et un code d'erreur technique sont
 * enregistrés : jamais l'audio, la transcription ni le contenu de la facture.
 *
 * Le suivi ne fait jamais échouer la requête.
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type VoiceTrackerInput = {
  supabaseUrl: string;
  userId: string;
  attemptId?: string | null;
  platform?: string | null;
  clientInfo?: string | null;
};

export type VoiceTracker = {
  transcribed: () => Promise<void>;
  draftGenerated: () => Promise<void>;
  failed: (errorCode: string) => Promise<void>;
};

function resolvePlatform(platform?: string | null, clientInfo?: string | null): string {
  if (platform === 'web' || platform === 'ios' || platform === 'android') return platform;
  const info = (clientInfo ?? '').toLowerCase();
  // L'app mobile n'est publiée que sur iOS.
  if (info.includes('runtime=react-native') || info.startsWith('supabase-js-react-native')) return 'ios';
  if (info.includes('runtime=web') || info.startsWith('supabase-js-web')) return 'web';
  return 'unknown';
}

export function createVoiceTracker(input: VoiceTrackerInput | null): VoiceTracker {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const attemptId = input?.attemptId?.trim() ?? '';

  if (!input || !serviceRoleKey || !UUID_PATTERN.test(attemptId)) {
    const noop = async () => {};
    return { transcribed: noop, draftGenerated: noop, failed: noop };
  }

  const admin = createClient(input.supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const platform = resolvePlatform(input.platform, input.clientInfo);
  let finished = false;

  async function insert(event: string, dedupPrefix: string, extra: Record<string, unknown>) {
    try {
      const { error } = await admin.from('product_events').upsert(
        {
          user_id: input!.userId,
          event_name: event,
          platform,
          attempt_id: attemptId,
          source: 'server',
          dedup_key: `${dedupPrefix}:${attemptId}`,
          ...extra,
        },
        { onConflict: 'dedup_key', ignoreDuplicates: true },
      );
      if (error) console.warn('[product-events]', event, error.message);
    } catch (error) {
      console.warn('[product-events]', event, error instanceof Error ? error.message : error);
    }
  }

  return {
    transcribed: () =>
      insert('voice_invoice_transcription_completed', 'voice_transcribed', { outcome: 'success' }),
    draftGenerated: async () => {
      finished = true;
      await insert('voice_invoice_draft_generated', 'voice_draft', { outcome: 'success' });
    },
    failed: async (errorCode: string) => {
      if (finished) return;
      finished = true;
      const code = /^[a-z0-9_.:-]{1,64}$/.test(errorCode) ? errorCode : 'unknown';
      await insert('voice_invoice_failed', 'voice_failed', { outcome: 'failure', error_code: code });
    },
  };
}
