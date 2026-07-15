'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Search } from 'lucide-react';

import { APP_NAV_FOOTER, APP_NAV_SECTIONS, isAppNavActive } from '@/lib/app-nav';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { cn } from '@/lib/utils';
import { SITE_NAME } from '@/lib/constants';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { activeCompany, companies, switchCompany } = useTenant();

  async function handleSignOut() {
    await signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-5">
        <Link className="flex items-center gap-2.5" href="/app">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            F
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">{SITE_NAME}</span>
        </Link>

        {companies.length > 0 ? (
          <div className="relative mt-4">
            <select
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-8 text-sm font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(e) => void switchCompany(e.target.value)}
              value={activeCompany?.id ?? ''}>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
          </div>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {APP_NAV_SECTIONS.map((section) => (
          <div className="mb-6" key={section.id}>
            {section.label ? (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </p>
            ) : null}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isAppNavActive(pathname, item);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-blue-50 text-primary'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      )}
                      href={item.href}>
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 px-3 py-4">
        <ul className="space-y-1">
          {APP_NAV_FOOTER.map((item) => {
            const active = isAppNavActive(pathname, item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-50 text-primary'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )}
                  href={item.href}>
                  <Icon size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              onClick={() => void handleSignOut()}
              type="button">
              <LogOut size={18} />
              Déconnexion
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}

export function AppTopBar({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </div>
  );
}
