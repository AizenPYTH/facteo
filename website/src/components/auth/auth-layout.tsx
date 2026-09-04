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

        <Link className="relative z-10 shrink-0 rounded-xl bg-white px-3 py-2" href="/">
          <BrandWordmark />
        </Link>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center">
          {/* -mt-* : légèrement au-dessus du centre géométrique */}
          <div className="-mt-10 max-w-md xl:-mt-12">
            <h2 className="text-[1.5rem] font-semibold leading-snug tracking-[-0.02em] xl:text-[1.75rem]">
              Du devis signé au paiement encaissé.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-indigo-100/85 xl:text-[0.9375rem]">
              Le même compte sur ordinateur et sur iPhone. Vos documents, vos clients et vos
              encaissements suivent.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                'Devis convertis en factures sans ressaisie',
                'Signature du client intégrée au PDF',
                'Facturation électronique via plateforme agréée',
              ].map((item) => (
                <li className="flex items-start gap-3 text-[13.5px] text-indigo-50/90" key={item}>
                  <span
                    aria-hidden
                    className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-200/80"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="relative z-10 shrink-0 text-xs text-indigo-200/70">
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
      </aside>

      <div className="flex min-h-svh flex-1 flex-col justify-center px-6 py-10 sm:py-12 lg:px-14 lg:py-10 xl:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link className="mb-8 flex lg:hidden" href="/">
            <BrandWordmark />
          </Link>
          <h1 className="text-[1.75rem] font-semibold tracking-[-0.025em] text-slate-900">
            {title}
          </h1>
          {subtitle ? <p className="mt-2.5 text-[15px] text-slate-500">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
