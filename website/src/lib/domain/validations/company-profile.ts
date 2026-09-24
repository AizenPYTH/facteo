import { z } from 'zod';

const optionalText = z.string().trim();

function normalizeDigits(value: string): string {
  return value.replace(/\s/g, '');
}

const companyFields = {
  companyName: z.string().trim().min(1, 'Champ obligatoire.'),
  phone: optionalText,
  address: optionalText,
  postalCode: optionalText.max(40),
  city: optionalText,
  country: optionalText,
  siren: optionalText
    .refine((value) => !value || /^\d{9}$/.test(normalizeDigits(value)), 'Le SIREN doit contenir 9 chiffres')
    .optional(),
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
};

/** Profil complet : prénom et nom facultatifs, e-mail obligatoire. */
export const companyProfileSchema = z.object({
  ...companyFields,
  firstName: optionalText,
  lastName: optionalText,
  email: z
    .string()
    .trim()
    .min(1, 'Champ obligatoire.')
    .email('Adresse e-mail invalide.'),
});

/**
 * Page Entreprise : prénom, nom et e-mail n'y sont pas affichés. Les exiger
 * bloquait l'enregistrement sans aucun message visible.
 */
export const companyOnlySchema = z.object({
  ...companyFields,
  firstName: optionalText,
  lastName: optionalText,
  email: optionalText.refine(
    (value) => !value || z.string().email().safeParse(value).success,
    'Adresse e-mail invalide.',
  ),
});

export type CompanyProfileSchemaValues = z.infer<typeof companyProfileSchema>;
