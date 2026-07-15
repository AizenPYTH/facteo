'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { getAuthErrorMessage } from '@/lib/domain/auth/errors';
import { registerSchema, type RegisterFormValues } from '@/lib/domain/validations/register';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

export function RegisterForm() {
  const { signUp } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    const { error, session } = await signUp(values);
    if (error) {
      setFormError(getAuthErrorMessage(error.message));
      return;
    }
    if (session) {
      window.location.href = '/app';
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
        <h2 className="text-lg font-semibold text-emerald-900">Vérifiez votre e-mail</h2>
        <p className="mt-2 text-sm text-emerald-800">
          Un lien de confirmation vous a été envoyé à votre adresse e-mail. Cliquez dessus pour activer votre compte.
          Vérifiez aussi vos spams.
        </p>
        <Link className="mt-6 inline-block text-sm font-semibold text-primary hover:underline" href="/login">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  const fields = [
    { name: 'firstName' as const, label: 'Prénom', type: 'text', autoComplete: 'given-name' },
    { name: 'lastName' as const, label: 'Nom', type: 'text', autoComplete: 'family-name' },
    { name: 'companyName' as const, label: 'Entreprise', type: 'text', autoComplete: 'organization' },
    { name: 'email' as const, label: 'E-mail', type: 'email', autoComplete: 'email' },
    { name: 'password' as const, label: 'Mot de passe', type: 'password', autoComplete: 'new-password' },
    {
      name: 'confirmPassword' as const,
      label: 'Confirmer le mot de passe',
      type: 'password',
      autoComplete: 'new-password',
    },
  ];

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {formError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {formError}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div className={field.name === 'companyName' || field.name === 'email' ? 'sm:col-span-2' : ''} key={field.name}>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={field.name}>
              {field.label}
            </label>
            <input
              autoComplete={field.autoComplete}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              id={field.name}
              type={field.type}
              {...register(field.name)}
            />
            {errors[field.name] ? (
              <p className="mt-1 text-xs text-red-600">{errors[field.name]?.message}</p>
            ) : null}
          </div>
        ))}
      </div>

      <button
        className={cn(
          'w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-60',
        )}
        disabled={isSubmitting}
        type="submit">
        {isSubmitting ? 'Création…' : 'Créer mon compte'}
      </button>

      <p className="text-center text-sm text-slate-500">
        Déjà un compte ?{' '}
        <Link className="font-semibold text-primary hover:underline" href="/login">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
