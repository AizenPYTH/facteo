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

/**
 * Règle métier — DESIGN §5.5 : nom/prénom OU entreprise, résolue par le choix
 * explicite Entreprise / Particulier en tête de formulaire. `clientKind` est un
 * champ UI (non persisté) qui pilote une validation conditionnelle :
 * - Entreprise : `company` requis, `lastName` non requis.
 * - Particulier : `lastName` requis, `company` masqué (donc non requis).
 */
export const clientFormSchema = z
  .object({
    clientKind: z.enum(['company', 'person']),
    lastName: optionalText,
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
  })
  .superRefine((values, ctx) => {
    if (values.clientKind === 'company' && !values.company.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Champ obligatoire.',
        path: ['company'],
      });
    }

    if (values.clientKind === 'person' && !values.lastName.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Champ obligatoire.',
        path: ['lastName'],
      });
    }
  });

export type ClientFormSchemaValues = z.infer<typeof clientFormSchema>;
