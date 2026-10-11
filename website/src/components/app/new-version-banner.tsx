'use client';

import { useEffect, useRef, useState } from 'react';

const CHECK_INTERVAL_MS = 5 * 60_000;

async function fetchDeployedVersion(): Promise<string | null> {
  try {
    const response = await fetch('/api/version', { cache: 'no-store' });
    if (!response.ok) return null;
    const body = (await response.json()) as { id?: unknown };
    return typeof body.id === 'string' && body.id ? body.id : null;
  } catch {
    return null;
  }
}

/**
 * Un onglet ouvert avant une mise à jour garde l'ancien code (et l'ancien PDF)
 * tant qu'on ne recharge pas. On compare la version chargée à celle en ligne
 * au retour sur l'onglet et toutes les 5 minutes, et on propose de recharger :
 * jamais d'office, pour ne pas perdre une facture en cours de saisie.
 */
export function NewVersionBanner() {
  const loadedRef = useRef<string | null>(null);
  const [outdated, setOutdated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadedRef.current = document.documentElement.dataset.dplId || null;

    async function check() {
      const deployed = await fetchDeployedVersion();
      if (cancelled || !deployed) return;
      if (!loadedRef.current) {
        loadedRef.current = deployed;
        return;
      }
      if (deployed !== loadedRef.current) setOutdated(true);
    }

    void check();
    const timer = window.setInterval(() => void check(), CHECK_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (!outdated) return null;

  return (
    <div
      className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-app-border bg-app-surface px-4 py-3 shadow-app-float min-[900px]:bottom-5"
      role="status">
      <p className="min-w-0 flex-1 text-[13.5px] text-app-text">
        Une nouvelle version d’INVEQ est disponible.
      </p>
      <button
        className="shrink-0 rounded-[10px] bg-app-accent px-3.5 py-2 text-[13px] font-semibold text-white hover:opacity-90"
        onClick={() => window.location.reload()}
        type="button">
        Recharger
      </button>
    </div>
  );
}
