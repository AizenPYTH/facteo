import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Users,
  Wrench,
} from 'lucide-react';

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefixes?: string[];
};

export type AppNavSection = {
  id: string;
  label?: string;
  items: AppNavItem[];
};

export const APP_NAV_SECTIONS: AppNavSection[] = [
  {
    id: 'main',
    items: [
      { href: '/app', label: 'Tableau de bord', icon: LayoutDashboard, matchPrefixes: ['/app'] },
      { href: '/app/clients', label: 'Clients', icon: Users, matchPrefixes: ['/app/clients'] },
      { href: '/app/quotes', label: 'Devis', icon: FileText, matchPrefixes: ['/app/quotes'] },
      { href: '/app/invoices', label: 'Factures', icon: Receipt, matchPrefixes: ['/app/invoices'] },
      {
        href: '/app/payments',
        label: 'Paiements',
        icon: CreditCard,
        matchPrefixes: ['/app/payments'],
      },
    ],
  },
  {
    id: 'workspace',
    label: 'Catalogue',
    items: [
      { href: '/app/products', label: 'Produits', icon: Package, matchPrefixes: ['/app/products'] },
      {
        href: '/app/prestations',
        label: 'Prestations',
        icon: Wrench,
        matchPrefixes: ['/app/prestations'],
      },
      {
        href: '/app/companies',
        label: 'Entreprises',
        icon: Building2,
        matchPrefixes: ['/app/companies'],
      },
    ],
  },
];

export const APP_NAV_FOOTER: AppNavItem[] = [
  {
    href: '/app/settings',
    label: 'Paramètres',
    icon: Settings,
    matchPrefixes: ['/app/settings'],
  },
];

export function isAppNavActive(pathname: string, item: AppNavItem): boolean {
  if (item.href === '/app') {
    return pathname === '/app' || pathname === '/app/';
  }

  const prefixes = item.matchPrefixes ?? [item.href];
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
