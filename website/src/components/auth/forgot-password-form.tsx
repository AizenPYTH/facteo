'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { getAuthErrorMessage } from '@/lib/domain/auth/errors';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

const forgotSchema = z.object({
  email: z.string().min(1, 'Champ obligatoire.').email('Adresse e-mail invalide.'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotFormValues) {
    setFormError(null);
    const { error } = await resetPassword(values.email);
    if (error) {
      setFormError(getAuthErrorMessage(error.message));
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-6 py-8 text-center">
        <h2 className="text-lg font-semibold text-blue-900">E-mail envoyé</h2>
        <p className="mt-2 text-sm text-blue-800">
          Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation.
          Vérifiez aussi vos spams.
        </p>
        <Link className="mt-6 inline-block text-sm font-semibold text-primary hover:underline" href="/login">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {formError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {formError}
        </div>
      ) : null}

      <p className="text-sm text-slate-500">
        Saisissez votre adresse e-mail. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
      </p>

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

      <button
        className={cn(
          'w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-60',
        )}
        disabled={isSubmitting}
        type="submit">
        {isSubmitting ? 'Envoi…' : 'Envoyer le lien'}
      </button>

      <p className="text-center text-sm text-slate-500">
        <Link className="font-semibold text-primary hover:underline" href="/login">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
