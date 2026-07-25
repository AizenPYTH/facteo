'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Search } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

import { CompanySwitcher } from '@/components/app/company-switcher';
import { BrandWordmark } from '@/components/brand/brand-logo';
import { APP_NAV_FOOTER, APP_NAV_SECTIONS, isAppNavActive } from '@/lib/app-nav';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const reduceMotion = useReducedMotion();

  async function handleSignOut() {
    await signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200/90 bg-white/95 backdrop-blur-sm">
      <div className="border-b border-slate-100 px-5 py-5">
        <Link className="group flex items-center" href="/app">
          <BrandWordmark className="w-[188px] sm:w-[188px] lg:w-[188px]" />
        </Link>

        <CompanySwitcher />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {APP_NAV_SECTIONS.map((section) => (
          <div className="mb-6" key={section.id}>
            {section.label ? (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {section.label}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isAppNavActive(pathname, item);
                const Icon = item.icon;
                return (
                  <li className="relative" key={item.href}>
                    {active ? (
                      <motion.span
                        className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-primary"
                        layoutId={reduceMotion ? undefined : 'app-nav-indicator'}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    ) : null}
                    <Link
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                        active
                          ? 'bg-blue-50/90 text-primary'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      )}
                      href={item.href}>
                      <Icon
                        className={cn(active ? 'text-primary' : 'text-slate-400')}
                        size={18}
                        strokeWidth={active ? 2.25 : 2}
                      />
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
        <ul className="space-y-0.5">
          {APP_NAV_FOOTER.map((item) => {
            const active = isAppNavActive(pathname, item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                    active
                      ? 'bg-blue-50/90 text-primary'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )}
                  href={item.href}>
                  <Icon
                    className={cn(active ? 'text-primary' : 'text-slate-400')}
                    size={18}
                  />
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
              <LogOut className="text-slate-400" size={18} />
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
    <header className="flex items-center justify-between border-b border-slate-200/90 bg-white/95 px-6 py-4 backdrop-blur-sm sm:px-8 sm:py-5">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {children ? <div className="ml-4 flex shrink-0 items-center gap-2">{children}</div> : null}
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
        className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </div>
  );
}
