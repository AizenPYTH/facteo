import { z } from 'zod';

import { ACTIVITY_TYPES, type ActivityType } from '@/lib/domain/validations/register';

const activityTypeValues = ACTIVITY_TYPES.map((type) => type.value) as [
  ActivityType,
  ...ActivityType[],
];

const optionalText = z.string().trim();

function normalizeDigits(value: string): string {
  return value.replace(/\s/g, '');
}

export const CURRENCIES = [
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'USD', label: 'Dollar US (USD)' },
  { value: 'GBP', label: 'Livre sterling (GBP)' },
  { value: 'CHF', label: 'Franc suisse (CHF)' },
  { value: 'CAD', label: 'Dollar canadien (CAD)' },
] as const;

export const onboardingStep1Schema = z.object({
  companyName: z.string().trim().min(1, 'Indiquez le nom de votre entreprise.'),
  activityType: z.enum(activityTypeValues, {
    errorMap: () => ({ message: 'Choisissez un type d’activité.' }),
  }),
});

export const onboardingStep2Schema = z.object({
  phone: optionalText,
  address: optionalText,
  city: optionalText,
  postalCode: optionalText.refine(
    (value) => !value || /^\d{5}$/.test(value),
    'Le code postal doit contenir 5 chiffres',
  ),
  country: optionalText,
});

export const onboardingStep3Schema = z.object({
  currency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/, 'Devise invalide.'),
  vatNumber: optionalText.refine(
    (value) => !value || /^[A-Z]{2}[A-Z0-9]{2,13}$/i.test(normalizeDigits(value)),
    'Numéro de TVA invalide',
  ),
  siret: optionalText.refine((value) => {
    if (!value) return true;
    const digits = normalizeDigits(value);
    return /^\d{9}$/.test(digits) || /^\d{14}$/.test(digits);
  }, 'Le SIREN (9 chiffres) ou SIRET (14 chiffres) est invalide'),
});

export const onboardingSchema = onboardingStep1Schema
  .merge(onboardingStep2Schema)
  .merge(onboardingStep3Schema);

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
export type OnboardingStep1Values = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2Values = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep3Values = z.infer<typeof onboardingStep3Schema>;

export function createEmptyOnboardingValues(): OnboardingFormValues {
  return {
    companyName: '',
    activityType: 'artisan',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    currency: 'EUR',
    vatNumber: '',
    siret: '',
  };
}
