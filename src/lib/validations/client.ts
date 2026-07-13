import { z } from 'zod';

import { isValidFrenchPhone } from '@/lib/format/phone';
import { isValidSiren, isValidSiret, normalizeRegistrationDigits } from '@/lib/company-search';

const optionalText = z.string().trim();

const optionalSiren = optionalText.refine(
  (value) => !value || isValidSiren(normalizeRegistrationDigits(value)),
  'SIREN invalide.',
);

const optionalSiret = optionalText.refine(
  (value) => !value || isValidSiret(normalizeRegistrationDigits(value)),
  'SIRET invalide.',
);

export const clientFormSchema = z.object({
  lastName: z.string().trim().min(1, 'Champ obligatoire.'),
  firstName: optionalText,
  company: optionalText,
  email: optionalText.refine(
    (value) => !value || z.string().email().safeParse(value).success,
    'Adresse e-mail invalide.',
  ),
  phone: optionalText.refine(isValidFrenchPhone, 'Numéro de téléphone invalide.'),
  address: optionalText,
  postalCode: optionalText.refine(
    (value) => !value || /^\d{5}$/.test(value),
    'Le code postal doit contenir 5 chiffres.',
  ),
  city: optionalText,
  country: optionalText,
  siren: optionalSiren,
  siret: optionalSiret,
  vatNumber: optionalText.refine(
    (value) => !value || /^[A-Z]{2}[A-Z0-9]{2,13}$/i.test(value.replace(/\s/g, '')),
    'Numéro de TVA invalide.',
  ),
  notes: optionalText,
});

export type ClientFormSchemaValues = z.infer<typeof clientFormSchema>;
