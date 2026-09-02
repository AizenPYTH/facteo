'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { AuthDivider, GoogleAuthButton } from '@/components/auth/google-auth-button';
import { getAuthErrorMessage } from '@/lib/domain/auth/errors';
import { getPostAuthPath } from '@/lib/domain/auth/post-auth';
import { loginSchema, type LoginFormValues } from '@/lib/domain/validations/login';
import { isSafeAppRedirect } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

export function LoginForm() {
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const requestedRedirect = searchParams.get('redirect');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);

    try {
      const { error, session } = await signIn(values);

      if (error) {
        setFormError(getAuthErrorMessage(error.message));
        return;
      }

      if (!session?.user) {
        setFormError('Connexion impossible. Vérifiez votre e-mail et mot de passe.');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      const path = await getPostAuthPath(session.user.id);
      const dest = path === '/app' && isSafeAppRedirect(requestedRedirect) ? requestedRedirect : path;
      window.location.href = dest;
    } catch {
      setFormError('Erreur de connexion. Vérifiez votre connexion internet.');
    }
  }

  return (
    <div className="space-y-1">
      <GoogleAuthButton next={requestedRedirect} />
      <AuthDivider />

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {formError ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert">
            {formError}
          </div>
        ) : null}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="email">
            Adresse e-mail
          </label>
          <input
            autoComplete="email"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            id="email"
            placeholder="vous@entreprise.fr"
            type="email"
            {...register('email')}
          />
          {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="password">
            Mot de passe
          </label>
          <input
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            id="password"
            placeholder="Votre mot de passe"
            type="password"
            {...register('password')}
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-end text-sm">
          <Link className="font-semibold text-primary hover:underline" href="/mot-de-passe-oublie">
            Mot de passe oublié ?
          </Link>
        </div>

        <button
          className={cn(
            'w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-60',
          )}
          disabled={isSubmitting}
          type="submit">
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
        </button>

        <p className="text-center text-sm text-slate-500">
          Pas encore de compte ?{' '}
          <Link
            className="font-semibold text-primary hover:underline"
            href={
              isSafeAppRedirect(requestedRedirect)
                ? `/register?redirect=${encodeURIComponent(requestedRedirect)}`
                : '/register'
            }>
            Créer un compte
          </Link>
        </p>
      </form>
    </div>
  );
}
