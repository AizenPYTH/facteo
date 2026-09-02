import { Suspense } from 'react';
import type { Metadata } from 'next';

import { AuthLayout } from '@/components/auth/auth-layout';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Créer un compte',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <AuthLayout
      subtitle="Créez votre compte en quelques secondes. Aucune carte requise."
      title="Créer un compte">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
