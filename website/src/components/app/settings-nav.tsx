'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  BookOpen,
  Building2,
  CreditCard,
  FileText,
  Hash,
  History,
  LifeBuoy,
  Palette,
  Receipt,
  Shield,
  Trash2,
  type LucideIcon,
} from 'lucide-react';

import { SUPPORT_EMAIL } from '@/lib/constants';
import { cn } from '@/lib/utils';

type SettingsNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefixes?: string[];
  external?: boolean;
};

type SettingsNavGroup = {
  title: string;
  items: SettingsNavLink[];
};

export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    title: 'Compte',
    items: [
      { href: '/app/settings/profile', label: 'Profil', icon: Shield },
      { href: '/app/settings/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    title: 'Entreprise',
    items: [
      { href: '/app/settings/company', label: 'Profil entreprise', icon: Building2 },
      { href: '/app/companies', label: 'Entreprises', icon: Building2 },
    ],
  },
  {
    title: 'Facturation',
    items: [
      { href: '/app/settings/numbering', label: 'Numérotation', icon: Hash },
      { href: '/app/settings/templates', label: 'Modèles PDF', icon: Palette },
      {
        href: '/app/settings/e-invoicing',
        label: 'Facturation électronique',
        icon: Receipt,
        matchPrefixes: ['/app/settings/e-invoicing'],
      },
    ],
  },
  {
    title: 'Abonnement',
    items: [
      { href: '/app/settings/subscription', label: 'Offre et paiement', icon: CreditCard },
      { href: '/app/settings/history', label: 'Historique', icon: History },
    ],
  },
];

const SETTINGS_NAV_FOOTER: SettingsNavLink[] = [
  { href: '/support', label: 'Centre d’aide', icon: LifeBuoy },
  { href: '/support#guide', label: 'Guide d’utilisation', icon: BookOpen },
  { href: '/confidentialite', label: 'Confidentialité', icon: FileText },
  { href: '/conditions-utilisation', label: 'Conditions', icon: FileText },
  { href: '/mentions-legales', label: 'Mentions légales', icon: FileText },
  { href: '/cookies', label: 'Cookies', icon: FileText },
  {
    href: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Demande de suppression de compte INVEQ')}`,
    label: 'Supprimer le compte',
    icon: Trash2,
    external: true,
  },
];

function isActive(pathname: string, item: SettingsNavLink): boolean {
  const prefixes = item.matchPrefixes ?? [item.href];
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function NavItem({ item, pathname }: { item: SettingsNavLink; pathname: string }) {
  const Icon = item.icon;
  const active = !item.external && !item.href.startsWith('mailto:') && isActive(pathname, item);
  const className = cn(
    'flex items-center gap-2.5 rounded-app-field px-2.5 py-2 text-[13px] transition-colors duration-150',
    active
      ? 'bg-app-accent-tint font-semibold text-app-accent'
      : 'font-medium text-app-text-3 hover:bg-app-hover',
  );

  const content = (
    <>
      <Icon
        className={cn('shrink-0', active ? 'text-app-accent' : 'text-app-muted-2')}
        size={16}
        strokeWidth={1.75}
      />
      <span className="truncate">{item.label}</span>
    </>
  );

  if (item.external || item.href.startsWith('mailto:') || item.href.startsWith('http')) {
    return (
      <a className={className} href={item.href}>
        {content}
      </a>
    );
  }

  return (
    <Link className={className} href={item.href}>
      {content}
    </Link>
  );
}

export function SettingsSideNav() {
  const pathname = usePathname();

  return (
    <nav className="sb flex h-full min-h-0 w-[236px] shrink-0 flex-col overflow-y-auto border-r border-app-border bg-app-surface px-3 py-3.5">
      {SETTINGS_NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="px-2.5 pb-1.5 pt-3 first:pt-0 text-[10.5px] font-bold uppercase tracking-[0.12em] text-app-faint">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <NavItem item={item} pathname={pathname} />
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="mt-auto border-t border-app-border-soft pt-3">
        <p className="px-2.5 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-app-faint">
          Aide et légal
        </p>
        <ul className="space-y-0.5">
          {SETTINGS_NAV_FOOTER.map((item) => (
            <li key={item.href}>
              <NavItem item={item} pathname={pathname} />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function SettingsMobileNav() {
  const pathname = usePathname();
  const items = SETTINGS_NAV_GROUPS.flatMap((group) => group.items);

  return (
    <div className="flex gap-1.5 overflow-x-auto border-b border-app-border bg-app-surface px-4 py-2 min-[900px]:hidden">
      {items.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            className={cn(
              'shrink-0 rounded-app-chip border px-3 py-[7px] text-[12.5px] font-semibold transition-colors duration-150',
              active
                ? 'border-app-accent-border bg-app-accent-tint text-app-accent-strong'
                : 'border-app-border text-app-text-3',
            )}
            href={item.href}
            key={item.href}>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
