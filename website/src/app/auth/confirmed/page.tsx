import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthLayout } from '@/components/auth/auth-layout';

export const metadata: Metadata = {
  title: 'Compte activé',
  robots: { index: false, follow: false },
};

export default function AuthConfirmedPage() {
  return (
    <AuthLayout title="Compte activé">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">
          ✓
        </div>
        <h2 className="mt-4 text-lg font-semibold text-emerald-900">Votre e-mail est confirmé</h2>
        <p className="mt-2 text-sm text-emerald-800">
          Votre compte FACTEO est prêt. Vous pouvez accéder à votre espace et commencer à facturer.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark"
            href="/app">
            Ouvrir mon espace
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            href="/login">
            Se connecter
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
