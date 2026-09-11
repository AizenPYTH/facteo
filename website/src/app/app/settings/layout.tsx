'use client';

import { Plus } from 'lucide-react';

import { AppTopBar } from '@/components/app/app-shell';
import { PrimaryLink } from '@/components/app/form-fields';
import { SettingsMobileNav, SettingsSideNav } from '@/components/app/settings-nav';
import { useTenant } from '@/providers/company-provider';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { activeCompany } = useTenant();

  return (
    <>
      {/* L'action primaire reste au même endroit sur tous les écrans (§Header d'écran). */}
      <AppTopBar
        subtitle={activeCompany?.name ?? 'Configurez INVEQ selon vos besoins'}
        title="Paramètres">
        <PrimaryLink href="/app/invoices?create=1">
          <Plus size={16} />
          Nouvelle facture
        </PrimaryLink>
      </AppTopBar>
      <SettingsMobileNav />
      <div className="flex min-h-0 flex-1">
        <div className="hidden min-[900px]:flex">
          <SettingsSideNav />
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-app-canvas">{children}</div>
      </div>
    </>
  );
}
