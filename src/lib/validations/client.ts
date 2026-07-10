import { z } from 'zod';

const optionalText = z.string().trim();

function normalizeDigits(value: string): string {
  return value.replace(/\s/g, '');
}

export const clientFormSchema = z.object({
  company: optionalText,
  contactName: z.string().trim().min(1, 'Le nom du contact est requis'),
  email: optionalText.refine(
    (value) => !value || z.string().email().safeParse(value).success,
    'Adresse email invalide',
  ),
  phone: optionalText,
  address: optionalText,
  postalCode: optionalText.refine(
    (value) => !value || /^\d{5}$/.test(value),
    'Le code postal doit contenir 5 chiffres',
  ),
  city: optionalText,
  country: optionalText,
  siren: optionalText.refine(
    (value) => !value || /^\d{9}$/.test(normalizeDigits(value)),
    'Le SIREN doit contenir 9 chiffres',
  ),
  siret: optionalText.refine(
    (value) => !value || /^\d{14}$/.test(normalizeDigits(value)),
    'Le SIRET doit contenir 14 chiffres',
  ),
  vatNumber: optionalText.refine(
    (value) => !value || /^[A-Z]{2}[A-Z0-9]{2,13}$/i.test(normalizeDigits(value)),
    'Numéro de TVA invalide',
  ),
  notes: optionalText,
});

export type ClientFormSchemaValues = z.infer<typeof clientFormSchema>;
