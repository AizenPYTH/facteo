import { Suspense } from 'react';
import type { Metadata } from 'next';

import { AuthLayout } from '@/components/auth/auth-layout';
import { LoginAlerts } from '@/components/auth/login-alerts';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Connexion',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <AuthLayout subtitle="Gérez vos devis et factures simplement." title="Connexion">
      <LoginAlerts />
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
