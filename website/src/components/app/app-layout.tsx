'use client';

import { Suspense } from 'react';

import { AppBottomNav, AppSidebar } from '@/components/app/app-shell';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-app-canvas">
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden max-[899px]:pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <Suspense fallback={null}>
        <AppBottomNav />
      </Suspense>
    </div>
  );
}
