import type { Metadata } from 'next';

import { AuthLayout } from '@/components/auth/auth-layout';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Réinitialiser le mot de passe">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
