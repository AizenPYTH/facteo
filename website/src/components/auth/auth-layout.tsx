import Link from 'next/link';

import { SITE_NAME } from '@/lib/constants';

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-primary p-12 text-white lg:flex">
        <Link className="flex items-center gap-3" href="/">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg font-bold">
            F
          </div>
          <span className="text-xl font-bold">{SITE_NAME}</span>
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            La facturation moderne pour artisans et PME.
          </h2>
          <p className="mt-4 max-w-md text-blue-100">
            Devis, factures et signatures — tout au même endroit, sur ordinateur et mobile.
          </p>
        </div>
        <p className="text-sm text-blue-200/80">© {new Date().getFullYear()} {SITE_NAME}</p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link className="mb-8 flex items-center gap-2 lg:hidden" href="/">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
              F
            </div>
            <span className="text-lg font-bold text-slate-900">{SITE_NAME}</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
