import { z } from 'zod';

import {
  CLIENT_IDENTITY_ERROR,
  hasValidClientIdentity,
} from '@/lib/clients/identity';
import { isValidPhone, isValidPostalCode } from '@/lib/format/phone';
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

export const clientFormSchema = z
  .object({
    lastName: optionalText,
    firstName: optionalText,
    company: optionalText,
    email: optionalText.refine(
      (value) => !value || z.string().email().safeParse(value).success,
      'Adresse e-mail invalide.',
    ),
    phone: optionalText.refine(isValidPhone, 'Numéro de téléphone invalide.'),
    address: optionalText,
    addressLine2: optionalText,
    postalCode: optionalText.refine(isValidPostalCode, 'Code postal invalide.'),
    city: optionalText,
    region: optionalText,
    country: optionalText,
    website: optionalText,
    siren: optionalSiren,
    siret: optionalSiret,
    vatNumber: optionalText.refine(
      (value) => !value || /^[A-Z]{2}[A-Z0-9]{2,13}$/i.test(value.replace(/\s/g, '')),
      'Numéro de TVA invalide.',
    ),
    notes: optionalText,
  })
  .superRefine((data, ctx) => {
    if (hasValidClientIdentity(data)) {
      return;
    }

    const lastName = data.lastName.trim();
    const firstName = data.firstName.trim();

    if (!lastName && !firstName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: CLIENT_IDENTITY_ERROR,
        path: ['company'],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: CLIENT_IDENTITY_ERROR,
        path: ['lastName'],
      });
      return;
    }

    if (!lastName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le nom est requis avec le prénom (ou renseignez une entreprise).',
        path: ['lastName'],
      });
    }

    if (!firstName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le prénom est requis avec le nom (ou renseignez une entreprise).',
        path: ['firstName'],
      });
    }
  });

export type ClientFormSchemaValues = z.infer<typeof clientFormSchema>;
