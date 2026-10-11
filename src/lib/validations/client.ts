import { z } from 'zod';

import { isValidFrenchPhone } from '@/lib/format/phone';
import { isValidSiren, isValidSiret, normalizeRegistrationDigits } from '@/lib/company-search';
import { isFrenchCountry } from '@/types/pdf-options';

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
    postalCode: optionalText.max(40),
    city: optionalText,
    country: optionalText,
    // Vérifiés selon le pays plus bas : SIREN / SIRET en France, numéro
    // national libre ailleurs (NIPC, NIF, Handelsregister…).
    siren: optionalText,
    siret: optionalText,
    vatNumber: optionalText.refine(
      (value) => !value || /^[A-Z]{2}[A-Z0-9]{2,13}$/i.test(value.replace(/\s/g, '')),
      'Numéro de TVA invalide.',
    ),
    notes: optionalText,
  })
  // Un client entreprise n'a pas forcément de contact nommé : le nom de
  // l'entreprise suffit. Il faut seulement pouvoir l'identifier.
  .refine((values) => Boolean(values.lastName || values.firstName || values.company), {
    message: 'Indiquez un nom ou une entreprise.',
    path: ['lastName'],
  })
  .superRefine((values, ctx) => {
    if (!isFrenchCountry(values.country)) {
      if (values.siret && !/^[A-Z0-9 .\-/]{2,30}$/i.test(values.siret)) {
        ctx.addIssue({ code: 'custom', path: ['siret'], message: 'Numéro invalide.' });
      }
      return;
    }
    if (!optionalSiren.safeParse(values.siren).success) {
      ctx.addIssue({ code: 'custom', path: ['siren'], message: 'SIREN invalide.' });
    }
    if (!optionalSiret.safeParse(values.siret).success) {
      ctx.addIssue({ code: 'custom', path: ['siret'], message: 'SIRET invalide.' });
    }
  });

export type ClientFormSchemaValues = z.infer<typeof clientFormSchema>;
