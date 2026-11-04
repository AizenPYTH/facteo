import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform, Settings } from 'react-native';

import { setPendingDictation } from '@/lib/ai/pending-dictation';

/** Clé écrite par le raccourci Siri natif (plugins/siri/InveqShortcuts.swift). */
const SIRI_DICTATION_KEY = 'inveqSiriDictation';
/** Au-delà, la dictée est périmée (app fermée puis rouverte bien plus tard). */
const MAX_AGE_SECONDS = 5 * 60;

/** Lit la dictée en attente une seule fois, puis l'efface. */
function takeSiriDictation(): string | null {
  const raw = Settings.get(SIRI_DICTATION_KEY);
  if (typeof raw !== 'string' || !raw) return null;
  Settings.set({ [SIRI_DICTATION_KEY]: null });
  try {
    const { text, at } = JSON.parse(raw) as { text?: unknown; at?: unknown };
    if (typeof text !== 'string' || !text.trim()) return null;
    if (typeof at === 'number' && Date.now() / 1000 - at > MAX_AGE_SECONDS) return null;
    return text;
  } catch {
    return null;
  }
}

/**
 * « Dis Siri, facture INVEQ » : Siri a demandé ce qu'il faut facturer puis
 * ouvert l'app. La dictée est reprise ici, que l'app vienne de démarrer ou
 * qu'elle tournait déjà, et ouvre une nouvelle facture que l'IA remplit.
 */
export function useSiriDictation(enabled: boolean) {
  useEffect(() => {
    if (Platform.OS !== 'ios' || !enabled) return;

    let frame: number | null = null;
    const check = () => {
      const text = takeSiriDictation();
      if (!text) return;
      setPendingDictation(text);
      // Une image plus tard : la pile de navigation est montée.
      frame = requestAnimationFrame(() => router.push('/invoices/new?voice=1' as Href));
    };

    check();
    const watchId = Settings.watchKeys(SIRI_DICTATION_KEY, check);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });

    return () => {
      Settings.clearWatch(watchId);
      subscription.remove();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [enabled]);
}
