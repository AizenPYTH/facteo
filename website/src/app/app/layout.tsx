'use client';

import { AppShell } from '@/components/app/app-layout';
import { CommandPaletteProvider } from '@/components/app/command-palette';
import { CompanyProvider } from '@/providers/company-provider';

export default function AppRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <CompanyProvider>
      <CommandPaletteProvider>
        <AppShell>{children}</AppShell>
      </CommandPaletteProvider>
    </CompanyProvider>
  );
}
