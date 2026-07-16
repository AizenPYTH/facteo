import type { Href } from 'expo-router';

export type DesktopNavItem = {
  href: Href;
  label: string;
  icon: { ios: string; android: string; web: string };
  matchPrefixes?: string[];
};

export type DesktopNavSection = {
  id: string;
  label?: string;
  items: DesktopNavItem[];
};

export const DESKTOP_NAV_SECTIONS: DesktopNavSection[] = [
  {
    id: 'main',
    items: [
      {
        href: '/',
        label: 'Tableau de bord',
        icon: { ios: 'square.grid.2x2', android: 'dashboard', web: 'dashboard' },
        matchPrefixes: ['/'],
      },
      {
        href: '/clients',
        label: 'Clients',
        icon: { ios: 'person.2', android: 'group', web: 'group' },
        matchPrefixes: ['/clients'],
      },
      {
        href: '/quotes',
        label: 'Devis',
        icon: { ios: 'doc.text', android: 'description', web: 'description' },
        matchPrefixes: ['/quotes'],
      },
      {
        href: '/invoices',
        label: 'Factures',
        icon: { ios: 'doc.plaintext', android: 'receipt_long', web: 'receipt_long' },
        matchPrefixes: ['/invoices'],
      },
      {
        href: '/invoices?status=paid',
        label: 'Paiements',
        icon: { ios: 'creditcard', android: 'payments', web: 'payments' },
        matchPrefixes: ['/invoices'],
      },
    ],
  },
  {
    id: 'workspace',
    label: 'Espace',
    items: [
      {
        href: '/settings/companies',
        label: 'Entreprises',
        icon: { ios: 'building.2', android: 'business', web: 'business' },
        matchPrefixes: ['/settings/companies'],
      },
    ],
  },
];

export const DESKTOP_NAV_FOOTER: DesktopNavItem[] = [
  {
    href: '/settings',
    label: 'Paramètres',
    icon: { ios: 'gearshape', android: 'settings', web: 'settings' },
    matchPrefixes: ['/settings', '/company'],
  },
  {
    href: '/settings',
    label: 'Support',
    icon: { ios: 'questionmark.circle', android: 'help', web: 'help' },
    matchPrefixes: [],
  },
  {
    href: '/settings',
    label: 'Légal',
    icon: { ios: 'doc.text.magnifyingglass', android: 'gavel', web: 'gavel' },
    matchPrefixes: [],
  },
  {
    href: '/settings',
    label: 'Profil',
    icon: { ios: 'person.circle', android: 'account_circle', web: 'account_circle' },
    matchPrefixes: [],
  },
];

/** @deprecated Use DESKTOP_NAV_SECTIONS */
export const DESKTOP_NAV_ITEMS: DesktopNavItem[] = DESKTOP_NAV_SECTIONS.flatMap(
  (section) => section.items,
);

export function normalizeAppPath(pathname: string): string {
  const stripped = pathname
    .replace(/^\/\(app\)\/\(tabs\)/, '')
    .replace(/^\/\(tabs\)/, '')
    .replace(/\/$/, '');

  return stripped || '/';
}

export function isNavItemActive(pathname: string, item: DesktopNavItem): boolean {
  const path = normalizeAppPath(pathname);

  if (item.href === '/') {
    return path === '/' || path === '';
  }

  if (item.label === 'Paiements') {
    return path.startsWith('/invoices') && path.includes('status=paid');
  }

  if (item.label === 'Factures') {
    return (
      (path === '/invoices' || path.startsWith('/invoices/')) &&
      !path.includes('status=paid')
    );
  }

  if (item.href === '/settings') {
    return (
      path.startsWith('/settings') ||
      path.startsWith('/company')
    ) && item.label === 'Paramètres';
  }

  const prefixes = item.matchPrefixes ?? [String(item.href)];

  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
