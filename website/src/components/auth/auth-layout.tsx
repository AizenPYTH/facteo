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
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-[linear-gradient(145deg,#0B0E14_0%,#312e81_45%,#4f46e5_100%)] p-12 text-white lg:flex">
        <Link href="/">
          <BrandWordmark className="[&_span]:text-white" markSize={36} />
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            La facturation moderne pour artisans et PME.
          </h2>
          <p className="mt-4 max-w-md text-indigo-100">
            Devis, factures et signatures — tout au même endroit, sur ordinateur et mobile.
          </p>
        </div>
        <p className="text-sm text-indigo-200/80">© {new Date().getFullYear()} {SITE_NAME}</p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link className="mb-8 flex lg:hidden" href="/">
            <BrandWordmark markSize={30} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
