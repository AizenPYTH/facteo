'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Building2, Check, ImagePlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { BrandWordmark } from '@/components/brand/brand-logo';
import { completeOnboarding } from '@/lib/domain/supabase/onboarding';
import { ACTIVITY_TYPES } from '@/lib/domain/validations/register';
import {
  CURRENCIES,
  createEmptyOnboardingValues,
  onboardingSchema,
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  type OnboardingFormValues,
} from '@/lib/domain/validations/onboarding';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useCompany } from '@/providers/company-provider';

const STEPS = [
  { id: 1, title: 'Entreprise', description: 'Présentez votre activité' },
  { id: 2, title: 'Coordonnées', description: 'Où vous joindre' },
  { id: 3, title: 'Paramètres', description: 'Devise et infos légales' },
] as const;

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

export function OnboardingWizard() {
  const { user } = useAuth();
  const {
    activeCompany,
    companies,
    scope,
    loading: companyLoading,
    createNewCompany,
  } = useCompany();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(1);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [bootstrapAttempted, setBootstrapAttempted] = useState(false);

  useEffect(() => {
    if (companyLoading || !user || companies.length > 0 || bootstrapAttempted) return;
    setBootstrapAttempted(true);
    setBootstrapping(true);
    void createNewCompany({ name: 'Mon entreprise' })
      .catch(() => {
        /* handle_new_user may still be catching up */
      })
      .finally(() => setBootstrapping(false));
  }, [bootstrapAttempted, companies.length, companyLoading, createNewCompany, user]);

  const defaults = useMemo(() => {
    const base = createEmptyOnboardingValues();
    if (!activeCompany) return base;
    return {
      ...base,
      companyName:
        activeCompany.name && activeCompany.name !== 'Mon entreprise'
          ? activeCompany.name
          : '',
      phone: activeCompany.phone ?? '',
      address: activeCompany.address ?? '',
      city: activeCompany.city ?? '',
      postalCode: activeCompany.postalCode ?? '',
      country: activeCompany.country ?? 'France',
      vatNumber: activeCompany.vatNumber ?? '',
      siret: activeCompany.siret ?? '',
    };
  }, [activeCompany]);

  const {
    register,
    trigger,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  });

  useEffect(() => {
    setValue('companyName', defaults.companyName);
    setValue('phone', defaults.phone);
    setValue('address', defaults.address);
    setValue('city', defaults.city);
    setValue('postalCode', defaults.postalCode);
    setValue('country', defaults.country);
    setValue('vatNumber', defaults.vatNumber);
    setValue('siret', defaults.siret);
    if (activeCompany?.logoUrl) setLogoPreview(activeCompany.logoUrl);
  }, [defaults, setValue, activeCompany?.logoUrl]);

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const firstName =
    (typeof user?.user_metadata?.first_name === 'string' && user.user_metadata.first_name) ||
    (typeof user?.user_metadata?.given_name === 'string' && user.user_metadata.given_name) ||
    null;
  const greeting = firstName ? `Bonjour ${firstName}` : 'Bienvenue';

  async function goNext() {
    setSubmitError(null);
    const fields =
      step === 1
        ? (['companyName', 'activityType'] as const)
        : step === 2
          ? (['phone', 'address', 'city', 'postalCode', 'country'] as const)
          : (['currency', 'vatNumber', 'siret'] as const);

    const schema =
      step === 1 ? onboardingStep1Schema : step === 2 ? onboardingStep2Schema : onboardingStep3Schema;
    const slice = Object.fromEntries(fields.map((key) => [key, getValues(key)]));
    const parsed = schema.safeParse(slice);
    if (!parsed.success) {
      await trigger([...fields]);
      return;
    }

    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }

    if (!scope) {
      setSubmitError('Espace entreprise introuvable. Rechargez la page.');
      return;
    }

    setSubmitting(true);
    try {
      await completeOnboarding(scope, getValues(), logoFile);
      window.location.href = '/app';
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Impossible d’enregistrer. Réessayez.',
      );
      setSubmitting(false);
    }
  }

  function goBack() {
    setSubmitError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function onLogoChange(file: File | null) {
    if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : activeCompany?.logoUrl ?? null);
  }

  if (companyLoading || bootstrapping) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (!scope) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
        <p className="text-sm text-slate-600">
          Impossible de préparer votre espace entreprise. Rechargez la page.
        </p>
        <button
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          onClick={() => window.location.reload()}
          type="button">
          Recharger
        </button>
      </div>
    );
  }

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_45%,#f8fafc_100%)]">
      <div className="mx-auto flex min-h-svh max-w-xl flex-col px-6 py-8 sm:py-12">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/">
            <BrandWordmark markSize={28} />
          </Link>
          <p className="text-xs font-medium text-slate-400">
            Étape {step} / {STEPS.length}
          </p>
        </header>

        <div className="mb-8">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${progress}%` }}
              initial={false}
              transition={{ duration: reduceMotion ? 0 : 0.35, ease: 'easeOut' }}
            />
          </div>
          <div className="mt-4 flex gap-2">
            {STEPS.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex-1 rounded-lg px-2 py-2 text-center text-[11px] font-semibold transition',
                  item.id === step
                    ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200/80'
                    : item.id < step
                      ? 'text-primary/80'
                      : 'text-slate-400',
                )}>
                {item.id < step ? (
                  <span className="inline-flex items-center gap-1">
                    <Check size={12} /> {item.title}
                  </span>
                ) : (
                  item.title
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-primary">{greeting}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
            {STEPS[step - 1].title}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">{STEPS[step - 1].description}</p>
        </div>

        <div className="flex-1 rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm shadow-slate-200/50 backdrop-blur sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduceMotion ? 0 : -12 }}
              initial={{ opacity: 0, x: reduceMotion ? 0 : 12 }}
              transition={{ duration: reduceMotion ? 0 : 0.22 }}>
              {step === 1 ? (
                <div className="space-y-5">
                  <Field
                    error={errors.companyName?.message}
                    id="companyName"
                    label="Nom de l’entreprise"
                    required
                    {...register('companyName')}
                  />
                  <div>
                    <label
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                      htmlFor="activityType">
                      Type d’activité <span className="text-primary">*</span>
                    </label>
                    <select className={inputClass} id="activityType" {...register('activityType')}>
                      {ACTIVITY_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.activityType ? (
                      <p className="mt-1 text-xs text-red-600">{errors.activityType.message}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <Field
                    error={errors.phone?.message}
                    id="phone"
                    label="Téléphone"
                    type="tel"
                    autoComplete="tel"
                    {...register('phone')}
                  />
                  <Field
                    error={errors.address?.message}
                    id="address"
                    label="Adresse"
                    autoComplete="street-address"
                    {...register('address')}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      error={errors.postalCode?.message}
                      id="postalCode"
                      label="Code postal"
                      autoComplete="postal-code"
                      {...register('postalCode')}
                    />
                    <Field
                      error={errors.city?.message}
                      id="city"
                      label="Ville"
                      autoComplete="address-level2"
                      {...register('city')}
                    />
                  </div>
                  <Field
                    error={errors.country?.message}
                    id="country"
                    label="Pays"
                    autoComplete="country-name"
                    {...register('country')}
                  />
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-5">
                  <div>
                    <label
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                      htmlFor="currency">
                      Devise
                    </label>
                    <select className={inputClass} id="currency" {...register('currency')}>
                      {CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    {errors.currency ? (
                      <p className="mt-1 text-xs text-red-600">{errors.currency.message}</p>
                    ) : null}
                  </div>
                  <Field
                    error={errors.vatNumber?.message}
                    id="vatNumber"
                    label="Numéro de TVA (optionnel)"
                    placeholder="FR12345678901"
                    {...register('vatNumber')}
                  />
                  <Field
                    error={errors.siret?.message}
                    id="siret"
                    label="SIREN / SIRET (optionnel)"
                    placeholder="9 ou 14 chiffres"
                    {...register('siret')}
                  />
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-slate-700">Logo (optionnel)</p>
                    <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-4 transition hover:border-primary/40 hover:bg-indigo-50/40">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
                        {logoPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt="Logo" className="h-full w-full object-contain" src={logoPreview} />
                        ) : (
                          <Building2 className="text-slate-300" size={22} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                          <ImagePlus size={16} /> Ajouter un logo
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">PNG, JPG ou WebP — max. 2 Mo</p>
                      </div>
                      <input
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="sr-only"
                        onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
                        type="file"
                      />
                    </label>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {submitError ? (
            <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </p>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100',
                step === 1 && 'invisible pointer-events-none',
              )}
              disabled={submitting || step === 1}
              onClick={goBack}
              type="button">
              <ArrowLeft size={16} />
              Retour
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-60"
              disabled={submitting}
              onClick={() => void goNext()}
              type="button">
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Enregistrement…
                </>
              ) : step === 3 ? (
                <>
                  Terminer
                  <Check size={16} />
                </>
              ) : (
                <>
                  Continuer
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Vous pourrez modifier ces informations plus tard dans les paramètres.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  id,
  required,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={id}>
        {label}
        {required ? <span className="text-primary"> *</span> : null}
      </label>
      <input className={cn(inputClass, className)} id={id} {...props} />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
