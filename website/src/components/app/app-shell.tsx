'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { FileText, LogOut, Plus, Receipt, Search, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { useCommandPalette } from '@/components/app/command-palette';
import { CompanySwitcher } from '@/components/app/company-switcher';
import { PrimaryButton } from '@/components/app/form-fields';
import { BrandWordmark } from '@/components/brand/brand-logo';
import { APP_NAV_FOOTER, APP_NAV_SECTIONS, isAppNavActive } from '@/lib/app-nav';
import { extractAuthIdentity } from '@/lib/domain/auth/identity';
import type { DashboardData } from '@/lib/domain/supabase/dashboard';
import { dashboardQueryKeys, subscriptionQueryKeys } from '@/lib/domain/supabase/query-keys';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import type { SubscriptionSnapshot } from '@/types/subscription';
import { cn } from '@/lib/utils';

const CREATE_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/app/quotes?create=1', label: 'Devis', icon: FileText },
  { href: '/app/invoices?create=1', label: 'Facture', icon: Receipt },
  { href: '/app/clients/new', label: 'Client', icon: UserPlus },
];

const NAV_ITEM_BASE =
  'flex h-9 w-full items-center gap-2.5 rounded-app-field px-2.5 text-[13.5px] transition-colors duration-150';

/** Lit une entrée déjà en cache sans jamais déclencher de requête : la nav ne charge aucune donnée. */
function useCachedQueryData<T>(queryKey: QueryKey): T | undefined {
  const queryClient = useQueryClient();

  const subscribe = useCallback(
    (onStoreChange: () => void) => queryClient.getQueryCache().subscribe(onStoreChange),
    [queryClient],
  );

  const getSnapshot = useCallback(
    () => queryClient.getQueryData<T>(queryKey),
    [queryClient, queryKey],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { scope } = useTenant();
  const { openPalette } = useCommandPalette();

  const companyId = scope?.companyId ?? 'anonymous';
  const userId = user?.id ?? 'anonymous';
  const dashboardKey = useMemo(() => dashboardQueryKeys.byCompany(companyId), [companyId]);
  const subscriptionKey = useMemo(() => subscriptionQueryKeys.snapshot(userId), [userId]);
  const dashboard = useCachedQueryData<DashboardData>(dashboardKey);
  const subscription = useCachedQueryData<SubscriptionSnapshot>(subscriptionKey);

  const identity = user ? extractAuthIdentity(user) : null;
  const displayName =
    [identity?.firstName, identity?.lastName].filter(Boolean).join(' ') ||
    identity?.email ||
    'Mon compte';
  const initials =
    [identity?.firstName, identity?.lastName]
      .filter(Boolean)
      .map((part) => part!.charAt(0).toUpperCase())
      .join('') || (identity?.email?.charAt(0).toUpperCase() ?? '·');
  const planLabel = subscription?.plan.displayName
    ? `Offre ${subscription.plan.displayName}`
    : identity?.email;

  const stats = dashboard?.stats;
  const navCounts: Record<string, { value: number; tone: 'neutral' | 'danger' } | undefined> = {
    '/app/quotes':
      stats && stats.pendingQuotes > 0 ? { value: stats.pendingQuotes, tone: 'neutral' } : undefined,
    '/app/invoices':
      stats && stats.lateInvoices > 0 ? { value: stats.lateInvoices, tone: 'danger' } : undefined,
  };

  async function handleSignOut() {
    await signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-[248px] shrink-0 flex-col border-r border-app-border bg-app-surface max-lg:w-[212px]">
      <div className="px-4 pt-4">
        <Link className="flex items-center" href="/app">
          <BrandWordmark className="w-[132px] sm:w-[132px] lg:w-[132px]" />
        </Link>
      </div>

      <div className="px-3 pb-3">
        <CompanySwitcher />
      </div>

      <div className="px-3 pb-2.5">
        <CreateMenu />
        <button
          className="mt-2 flex w-full items-center gap-2 rounded-app-control border border-app-border bg-app-subtle px-2.5 py-2 text-[13px] text-app-muted-2 transition-colors duration-150 hover:bg-app-hover hover:text-app-muted"
          onClick={openPalette}
          type="button">
          <Search className="shrink-0" size={15} />
          Rechercher
          <span className="ml-auto rounded-[5px] border border-app-border px-[5px] py-px text-[10.5px] font-semibold text-app-faint">
            ⌘K
          </span>
        </button>
      </div>

      <nav className="sb flex-1 overflow-y-auto px-3 pb-3 pt-1.5">
        {APP_NAV_SECTIONS.map((section) => (
          <div key={section.id}>
            {section.label ? (
              <p className="px-2.5 pb-1.5 pt-3.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-app-faint">
                {section.label}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isAppNavActive(pathname, item);
                const Icon = item.icon;
                const count = navCounts[item.href];
                return (
                  <li key={item.href}>
                    <Link
                      className={cn(
                        NAV_ITEM_BASE,
                        active
                          ? 'bg-app-accent-tint font-semibold text-app-accent'
                          : 'text-app-text-3 hover:bg-app-hover',
                      )}
                      href={item.href}>
                      <Icon
                        className={cn('shrink-0', active ? 'text-app-accent' : 'text-app-muted-2')}
                        size={17}
                        strokeWidth={1.75}
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {count ? (
                        <span
                          className={cn(
                            'app-num shrink-0 rounded-app-chip px-[7px] py-px text-[11px] font-semibold',
                            count.tone === 'danger'
                              ? 'bg-app-danger-tint text-app-danger-text'
                              : 'bg-app-border-soft text-app-muted',
                          )}>
                          {count.value}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-app-border-soft px-3 py-2.5">
        <ul className="space-y-0.5">
          {APP_NAV_FOOTER.map((item) => {
            const active = isAppNavActive(pathname, item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  className={cn(
                    NAV_ITEM_BASE,
                    active
                      ? 'bg-app-accent-tint font-semibold text-app-accent'
                      : 'text-app-text-3 hover:bg-app-hover',
                  )}
                  href={item.href}>
                  <Icon
                    className={cn('shrink-0', active ? 'text-app-accent' : 'text-app-muted-2')}
                    size={17}
                    strokeWidth={1.75}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-0.5 flex items-center gap-2.5 rounded-app-field px-2.5 py-2 transition-colors duration-150 hover:bg-app-hover">
          <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-app-border-soft text-[11px] font-bold text-app-text-3">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-semibold text-app-text">
              {displayName}
            </span>
            {planLabel ? (
              <span className="block truncate text-[11px] text-app-muted-2">{planLabel}</span>
            ) : null}
          </span>
          <button
            aria-label="Déconnexion"
            className="shrink-0 rounded-md p-1 text-app-faint transition-colors duration-150 hover:bg-app-border-soft hover:text-app-danger"
            onClick={() => void handleSignOut()}
            title="Déconnexion"
            type="button">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function CreateMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <PrimaryButton
        aria-expanded={open}
        aria-haspopup="menu"
        className="w-full py-2.5 text-[13.5px]"
        onClick={() => setOpen((value) => !value)}>
        <Plus size={16} strokeWidth={2.25} />
        Créer
      </PrimaryButton>

      {open ? (
        <div
          className="absolute left-0 right-0 z-40 mt-1.5 overflow-hidden rounded-app-control border border-app-border bg-app-surface p-1.5 shadow-app-float"
          role="menu">
          {CREATE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className="flex items-center gap-2.5 rounded-app-field px-2.5 py-2 text-[13px] font-medium text-app-text-2 transition-colors duration-150 hover:bg-app-accent-soft hover:text-app-accent"
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
                role="menuitem">
                <Icon className="shrink-0 text-app-accent" size={15} strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function AppTopBar({
  title,
  subtitle,
  count,
  toolbar,
  children,
}: {
  title: string;
  subtitle?: string;
  count?: number | string | null;
  toolbar?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="shrink-0 border-b border-app-border bg-app-surface">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3.5 sm:px-6">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-[19px] font-semibold tracking-[-0.01em] text-app-text">
              {title}
            </h1>
            {count !== undefined && count !== null ? (
              <span className="app-num shrink-0 rounded-app-chip bg-app-border-soft px-2 py-0.5 text-[11px] font-semibold text-app-muted">
                {count}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[13px] text-app-muted">{subtitle}</p>
          ) : null}
        </div>
        {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
      </div>
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-app-border-soft px-4 py-2.5 sm:px-6">
          {toolbar}
        </div>
      ) : null}
    </header>
  );
}

export function AppSearchInput({
  value,
  onChange,
  placeholder = 'Rechercher…',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-faint" size={16} />
      <input
        className="w-full rounded-app-control border border-app-border bg-app-subtle py-[9px] pl-9 pr-3 text-[13px] text-app-text outline-none transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-app-faint focus:border-app-accent focus:bg-app-surface focus:ring-2 focus:ring-app-accent/15"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </div>
  );
}
