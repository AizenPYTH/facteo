'use client';

import { AppShell } from '@/components/app/app-layout';
import { CompanyProvider } from '@/providers/company-provider';

export default function AppRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <CompanyProvider>
      <AppShell>{children}</AppShell>
    </CompanyProvider>
  );
}
