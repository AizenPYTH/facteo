import { z } from 'zod';

const optionalText = z.string().trim();

function normalizeDigits(value: string): string {
  return value.replace(/\s/g, '');
}

export const companyProfileSchema = z.object({
  companyName: z.string().trim().min(1, "Le nom de l'entreprise est requis"),
  firstName: z.string().trim().min(1, 'Le prénom est requis'),
  lastName: z.string().trim().min(1, 'Le nom est requis'),
  email: z
    .string()
    .trim()
    .min(1, "L'email est requis")
    .email('Adresse email invalide'),
  phone: optionalText,
  address: optionalText,
  postalCode: optionalText.refine(
    (value) => !value || /^\d{5}$/.test(value),
    'Le code postal doit contenir 5 chiffres',
  ),
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
});

export type CompanyProfileSchemaValues = z.infer<typeof companyProfileSchema>;
