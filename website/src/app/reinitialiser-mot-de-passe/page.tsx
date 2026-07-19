'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthLayout } from '@/components/auth/auth-layout';
import { getAuthErrorMessage } from '@/lib/domain/auth/errors';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

const schema = z
  .object({
    password: z.string().min(8, 'Au moins 8 caractères.'),
    confirmPassword: z.string().min(1, 'Champ obligatoire.'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updatePassword, session, loading } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (!loading && !session && !searchParams.get('code')) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
        <h2 className="text-lg font-semibold text-amber-900">Lien invalide ou expiré</h2>
        <p className="mt-2 text-sm text-amber-800">
          Demandez un nouveau lien de réinitialisation.
        </p>
        <Link className="mt-6 inline-block text-sm font-semibold text-primary hover:underline" href="/mot-de-passe-oublie">
          Mot de passe oublié
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
        <h2 className="text-lg font-semibold text-emerald-900">Mot de passe mis à jour</h2>
        <p className="mt-2 text-sm text-emerald-800">Vous pouvez maintenant vous connecter.</p>
        <Link className="mt-6 inline-block text-sm font-semibold text-primary hover:underline" href="/login">
          Se connecter
        </Link>
      </div>
    );
  }

  async function onSubmit(values: FormValues) {
    setFormError(null);
    const { error } = await updatePassword(values.password);
    if (error) {
      setFormError(getAuthErrorMessage(error.message));
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push('/login?reset=1'), 1200);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {formError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {formError}
        </div>
      ) : null}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="password">
          Nouveau mot de passe
        </label>
        <input
          autoComplete="new-password"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          id="password"
          type="password"
          {...register('password')}
        />
        {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password.message}</p> : null}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="confirmPassword">
          Confirmer le mot de passe
        </label>
        <input
          autoComplete="new-password"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword ? (
          <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
        ) : null}
      </div>

      <button
        className={cn(
          'w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark disabled:opacity-60',
        )}
        disabled={isSubmitting || loading}
        type="submit">
        {isSubmitting ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Nouveau mot de passe">
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
