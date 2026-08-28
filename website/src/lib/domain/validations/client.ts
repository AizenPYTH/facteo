import { z } from 'zod';

import { getClientIdentityError } from '@/lib/clients/identity';
import { isValidFrenchPhone } from '@/lib/format/phone';
import { isValidSiren, isValidSiret, normalizeRegistrationDigits } from '@/lib/company-search/validation';

const optionalText = z.string().trim();

const optionalSiren = optionalText.refine(
  (value) => !value || isValidSiren(normalizeRegistrationDigits(value)),
  'SIREN invalide.',
);

const optionalSiret = optionalText.refine(
  (value) => !value || isValidSiret(normalizeRegistrationDigits(value)),
  'SIRET invalide.',
);

export const clientFormSchema = z
  .object({
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
    const identityError = getClientIdentityError(values);
    if (!identityError) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: identityError,
      path: ['company'],
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: identityError,
      path: ['lastName'],
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: identityError,
      path: ['firstName'],
    });
  });

export type ClientFormSchemaValues = z.infer<typeof clientFormSchema>;
