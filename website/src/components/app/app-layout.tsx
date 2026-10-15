'use client';

import { Suspense, useEffect } from 'react';

import { AppBottomNav, AppSidebar } from '@/components/app/app-shell';
import { NewVersionBanner } from '@/components/app/new-version-banner';
import { trackSessionActive } from '@/lib/domain/analytics/product-events';
import { useAuth } from '@/providers/auth-provider';

/** Présence quotidienne (suivi d'utilisation) : à l'ouverture et au retour sur l'onglet. */
function useActivityPing() {
  const userId = useAuth().user?.id;
  useEffect(() => {
    if (!userId) return;
    trackSessionActive();
    const onVisible = () => {
      if (document.visibilityState === 'visible') trackSessionActive();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [userId]);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  useActivityPing();
  return (
    <div className="flex h-screen overflow-hidden bg-app-canvas">
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden max-[899px]:pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <Suspense fallback={null}>
        <AppBottomNav />
      </Suspense>
      <NewVersionBanner />
    </div>
  );
}
