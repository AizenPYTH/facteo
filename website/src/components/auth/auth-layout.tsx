import Link from 'next/link';

import { BrandWordmark } from '@/components/brand/brand-logo';
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
    <div className="flex min-h-svh">
      {/*
        self-start + h-svh : la colonne ne s’étire pas avec le formulaire.
        Logo en haut, message en flex-1/justify-center (pas de justify-between).
      */}
      <aside className="relative hidden w-[min(44%,520px)] shrink-0 flex-col self-start bg-[linear-gradient(145deg,#0B0E14_0%,#312e81_45%,#4f46e5_100%)] px-8 pb-6 pt-10 text-white lg:sticky lg:top-0 lg:flex lg:h-svh xl:w-[min(48%,560px)] xl:px-12 xl:pb-8 xl:pt-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_10%,rgba(168,85,247,0.28),transparent),radial-gradient(ellipse_60%_40%_at_90%_90%,rgba(99,102,241,0.2),transparent)]"
        />

        <Link className="relative z-10 shrink-0" href="/">
          <BrandWordmark className="[&_span]:text-white" markSize={32} />
        </Link>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center">
          {/* -mt-* : légèrement au-dessus du centre géométrique */}
          <div className="max-w-md -mt-10 xl:-mt-12">
            <h2 className="text-[1.375rem] font-bold leading-snug tracking-tight xl:text-2xl 2xl:text-[1.75rem]">
              La facturation moderne pour artisans et PME.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-indigo-100/90 xl:text-[0.9375rem]">
              Devis, factures et signatures — tout au même endroit, sur ordinateur et
              mobile.
            </p>
          </div>
        </div>

        <p className="relative z-10 shrink-0 text-xs text-indigo-200/70">
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
      </aside>

      <div className="flex min-h-svh flex-1 flex-col justify-center px-6 py-10 sm:py-12 lg:px-14 lg:py-10 xl:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link className="mb-8 flex lg:hidden" href="/">
            <BrandWordmark markSize={30} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
