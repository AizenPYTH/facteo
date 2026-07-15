'use client';

import Link from 'next/link';
import {
  Bell,
  Building2,
  CreditCard,
  FileText,
  History,
  Palette,
  Receipt,
  Shield,
} from 'lucide-react';

import { AppTopBar } from '@/components/app/app-shell';
import { Panel } from '@/components/app/ui';

const SETTINGS_SECTIONS = [
  {
    title: 'Compte',
    items: [
      { href: '/app/settings/profile', label: 'Profil', icon: Shield, desc: 'Informations personnelles' },
      { href: '/app/settings/notifications', label: 'Notifications', icon: Bell, desc: 'Préférences d’alertes' },
    ],
  },
  {
    title: 'Entreprise',
    items: [
      { href: '/app/settings/company', label: 'Profil entreprise', icon: Building2, desc: 'Coordonnées et logo' },
      { href: '/app/companies', label: 'Entreprises', icon: Building2, desc: 'Espaces de travail' },
    ],
  },
  {
    title: 'Facturation',
    items: [
      { href: '/app/settings/numbering', label: 'Numérotation', icon: FileText, desc: 'Préfixes devis et factures' },
      { href: '/app/settings/templates', label: 'Modèles PDF', icon: Palette, desc: 'Apparence des documents' },
    ],
  },
  {
    title: 'Abonnement',
    items: [
      { href: '/app/settings/subscription', label: 'Abonnement', icon: CreditCard, desc: 'Plan et facturation' },
      { href: '/app/settings/history', label: 'Historique', icon: History, desc: 'Activité du compte' },
    ],
  },
  {
    title: 'Légal',
    items: [
      { href: '/confidentialite', label: 'Confidentialité', icon: Receipt, desc: 'Politique de données' },
      { href: '/conditions-utilisation', label: 'Conditions', icon: FileText, desc: 'CGU' },
    ],
  },
];

export default function SettingsPage() {
  return (
    <>
      <AppTopBar subtitle="Configurez FACTEO selon vos besoins" title="Paramètres" />

      <div className="flex-1 space-y-8 overflow-y-auto p-8">
        {SETTINGS_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              {section.title}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link href={item.href} key={item.href}>
                    <Panel>
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary">
                          <Icon size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{item.label}</h3>
                          <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                    </Panel>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
