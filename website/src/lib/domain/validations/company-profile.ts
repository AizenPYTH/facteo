import { z } from 'zod';

import { isValidPostalCode } from '@/lib/format/phone';

const optionalText = z.string().trim();

function normalizeDigits(value: string): string {
  return value.replace(/\s/g, '');
}

export const companyProfileSchema = z.object({
  companyName: z.string().trim().min(1, 'Champ obligatoire.'),
  firstName: z.string().trim().min(1, 'Champ obligatoire.'),
  lastName: z.string().trim().min(1, 'Champ obligatoire.'),
  email: z
    .string()
    .trim()
    .min(1, 'Champ obligatoire.')
    .email('Adresse e-mail invalide.'),
  phone: optionalText,
  address: optionalText,
  postalCode: optionalText.refine(isValidPostalCode, 'Code postal invalide'),
  city: optionalText,
  country: optionalText,
  siret: optionalText.refine(
    (value) => !value || /^\d{14}$/.test(normalizeDigits(value)),
    'Le SIRET doit contenir 14 chiffres',
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
    (value) => !value || /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i.test(normalizeDigits(value)),
    'BIC invalide',
  ),
  paymentMethods: z
    .array(z.enum(['bank_transfer', 'cash', 'card', 'cheque', 'paypal', 'stripe']))
    .min(1, 'Sélectionnez au moins un moyen de paiement.'),
});

export type CompanyProfileSchemaValues = z.infer<typeof companyProfileSchema>;
