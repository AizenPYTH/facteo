'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { AuthDivider, GoogleAuthButton } from '@/components/auth/google-auth-button';
import { getAuthErrorMessage } from '@/lib/domain/auth/errors';
import { getPostAuthPath } from '@/lib/domain/auth/post-auth';
import { registerSchema, type RegisterFormValues } from '@/lib/domain/validations/register';
import { isSafeAppRedirect } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

function generateSecurePassword(length = 16): string {
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('');
}

export function RegisterForm() {
  const searchParams = useSearchParams();
  const { signUp } = useAuth();
  const requestedRedirect = searchParams.get('redirect');
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const confirmInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const syncPasswordsFromDom = useCallback(() => {
    const passwordDom = passwordInputRef.current?.value ?? '';
    const confirmDom = confirmInputRef.current?.value ?? '';
    const currentPassword = getValues('password');
    const currentConfirm = getValues('confirmPassword');

    if (passwordDom && passwordDom !== currentPassword) {
      setValue('password', passwordDom, { shouldDirty: true, shouldValidate: true });
    }
    if (confirmDom && confirmDom !== currentConfirm) {
      setValue('confirmPassword', confirmDom, { shouldDirty: true, shouldValidate: true });
    }
  }, [getValues, setValue]);

  useEffect(() => {
    const interval = window.setInterval(syncPasswordsFromDom, 250);
    return () => window.clearInterval(interval);
  }, [syncPasswordsFromDom]);

  function applyGeneratedPassword() {
    const next = generateSecurePassword();
    setValue('password', next, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
    setValue('confirmPassword', next, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
    if (passwordInputRef.current) passwordInputRef.current.value = next;
    if (confirmInputRef.current) confirmInputRef.current.value = next;
    setShowPassword(true);
  }

  async function onSubmit(values: RegisterFormValues) {
    syncPasswordsFromDom();
    const password = getValues('password') || values.password;
    const confirmPassword = getValues('confirmPassword') || values.confirmPassword;

    if (!password || password.length < 8) {
      setFormError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Les mots de passe ne correspondent pas.');
      return;
    }

    setFormError(null);
    const { error, session } = await signUp({
      email: values.email,
      password,
      firstName: values.firstName,
      lastName: values.lastName,
    });
    if (error) {
      setFormError(getAuthErrorMessage(error.message));
      return;
    }
    if (session?.user) {
      const path = await getPostAuthPath(session.user.id);
      const dest = path === '/app' && isSafeAppRedirect(requestedRedirect) ? requestedRedirect : path;
      window.location.href = dest;
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
        <h2 className="text-lg font-semibold text-emerald-900">Vérifiez votre e-mail</h2>
        <p className="mt-2 text-sm text-emerald-800">
          Un lien de confirmation vous a été envoyé. Après validation, vous configurerez votre
          entreprise en quelques minutes.
        </p>
        <Link className="mt-6 inline-block text-sm font-semibold text-primary hover:underline" href="/login">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  const passwordField = register('password');
  const confirmPasswordField = register('confirmPassword');

  return (
    <div className="space-y-1">
      <GoogleAuthButton label="S’inscrire avec Google" next={requestedRedirect} />
      <AuthDivider />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} autoComplete="on">
        {formError ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert">
            {formError}
          </div>
        ) : null}

        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Vous</h2>
            <p className="mt-0.5 text-xs text-slate-500">Identité du titulaire du compte.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              error={errors.firstName?.message}
              id="firstName"
              label="Prénom"
              autoComplete="given-name"
              {...register('firstName')}
            />
            <Field
              error={errors.lastName?.message}
              id="lastName"
              label="Nom"
              autoComplete="family-name"
              {...register('lastName')}
            />
          </div>
          <Field
            error={errors.email?.message}
            id="email"
            label="E-mail professionnel"
            type="email"
            autoComplete="email"
            {...register('email')}
          />
        </section>

        <section className="space-y-4 border-t border-slate-100 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Sécurité</h2>
              <p className="mt-0.5 text-xs text-slate-500">Au moins 8 caractères.</p>
            </div>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-blue-50"
              onClick={applyGeneratedPassword}
              type="button">
              <RefreshCw size={14} />
              Générer un mot de passe
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="password">
              Mot de passe
            </label>
            <div className="relative">
              <input
                autoComplete="new-password"
                className="autofill-detect w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                defaultValue=""
                id="password"
                name={passwordField.name}
                onAnimationStart={syncPasswordsFromDom}
                onBlur={(event) => {
                  void passwordField.onBlur(event);
                  syncPasswordsFromDom();
                }}
                onChange={(event) => {
                  void passwordField.onChange(event);
                  syncPasswordsFromDom();
                }}
                onInput={syncPasswordsFromDom}
                ref={(element) => {
                  passwordInputRef.current = element;
                  passwordField.ref(element);
                }}
                type={showPassword ? 'text' : 'password'}
              />
              <button
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                onClick={() => {
                  syncPasswordsFromDom();
                  setShowPassword((value) => !value);
                }}
                type="button">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password ? (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            ) : null}
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="confirmPassword">
              Confirmer le mot de passe
            </label>
            <input
              autoComplete="new-password"
              className="autofill-detect w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              defaultValue=""
              id="confirmPassword"
              name={confirmPasswordField.name}
              onAnimationStart={syncPasswordsFromDom}
              onBlur={(event) => {
                void confirmPasswordField.onBlur(event);
                syncPasswordsFromDom();
              }}
              onChange={(event) => {
                void confirmPasswordField.onChange(event);
                syncPasswordsFromDom();
              }}
              onInput={syncPasswordsFromDom}
              ref={(element) => {
                confirmInputRef.current = element;
                confirmPasswordField.ref(element);
              }}
              type={showPassword ? 'text' : 'password'}
            />
            {errors.confirmPassword ? (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            ) : null}
          </div>
        </section>

        <button
          className={cn(
            'w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-60',
          )}
          disabled={isSubmitting}
          type="submit">
          {isSubmitting ? 'Création…' : 'Créer mon compte'}
        </button>

        <p className="text-center text-xs text-slate-500">
          En créant un compte, vous acceptez nos{' '}
          <Link className="font-medium text-primary hover:underline" href="/conditions-utilisation">
            conditions d’utilisation
          </Link>{' '}
          et notre{' '}
          <Link className="font-medium text-primary hover:underline" href="/confidentialite">
            politique de confidentialité
          </Link>
          .
        </p>

        <p className="text-center text-sm text-slate-500">
          Déjà un compte ?{' '}
          <Link
            className="font-semibold text-primary hover:underline"
            href={
              isSafeAppRedirect(requestedRedirect)
                ? `/login?redirect=${encodeURIComponent(requestedRedirect)}`
                : '/login'
            }>
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

function Field({ label, error, id, className, ...props }: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={id}>
        {label}
      </label>
      <input
        className={cn(
          'w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20',
          className,
        )}
        id={id}
        {...props}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
