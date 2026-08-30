import { z } from 'zod';

import { isValidSiret, normalizeRegistrationDigits } from '@/lib/company-search';

const optionalText = z.string().trim();

function normalizeDigits(value: string): string {
  return value.replace(/\s/g, '');
}

export const companyProfileSchema = z
  .object({
    companyName: optionalText,
    firstName: optionalText,
    lastName: optionalText,
    email: z
      .string()
      .trim()
      .min(1, 'Champ obligatoire.')
      .email('Adresse e-mail invalide.'),
    phone: optionalText,
    address: optionalText,
    postalCode: optionalText.refine(
      (value) => !value || /^\d{5}$/.test(value),
      'Le code postal doit contenir 5 chiffres',
    ),
    city: optionalText,
    country: optionalText,
    /** Même règle Luhn que les clients — DESIGN §5.5. */
    siret: optionalText.refine(
      (value) => !value || isValidSiret(normalizeRegistrationDigits(value)),
      'SIRET invalide.',
    ),
    vatNumber: optionalText.refine(
      (value) => !value || /^[A-Z]{2}[A-Z0-9]{2,13}$/i.test(normalizeDigits(value)),
      'Numéro de TVA invalide',
    ),
    iban: optionalText.refine(
      (value) => !value || /^[A-Z]{2}[0-9A-Z]{13,32}$/i.test(normalizeDigits(value)),
      'IBAN invalide',
    ),
    bic: optionalText.refine(
      (value) =>
        !value || /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i.test(normalizeDigits(value)),
      'BIC invalide',
    ),
    paymentMethods: z
      .array(z.enum(['bank_transfer', 'cash', 'card', 'cheque', 'paypal', 'stripe']))
      .min(1, 'Sélectionnez au moins un moyen de paiement.'),
  })
  .superRefine((values, ctx) => {
    const hasCompany = Boolean(values.companyName.trim());
    const hasPerson = Boolean(values.firstName.trim() || values.lastName.trim());

    if (!hasCompany && !hasPerson) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indiquez le nom de l’entreprise ou un prénom / nom.',
        path: ['companyName'],
      });
    }
  });

export type CompanyProfileSchemaValues = z.infer<typeof companyProfileSchema>;
