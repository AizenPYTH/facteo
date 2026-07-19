import { z } from 'zod';

export const ACTIVITY_TYPES = [
  { value: 'artisan', label: 'Artisan' },
  { value: 'freelance', label: 'Freelance / indépendant' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'profession_liberale', label: 'Profession libérale' },
  { value: 'autre', label: 'Autre activité' },
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number]['value'];

const activityTypeValues = ACTIVITY_TYPES.map((type) => type.value) as [
  ActivityType,
  ...ActivityType[],
];

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Champ obligatoire.'),
    lastName: z.string().trim().min(1, 'Champ obligatoire.'),
    companyName: z
      .string()
      .trim()
      .min(1, 'Indiquez le nom de votre entreprise ou de votre activité.'),
    activityType: z.enum(activityTypeValues, {
      errorMap: () => ({ message: 'Choisissez un type d’activité.' }),
    }),
    email: z
      .string()
      .trim()
      .min(1, 'Champ obligatoire.')
      .email('Adresse e-mail invalide.'),
    phone: z.string().trim(),
    password: z
      .string()
      .min(1, 'Champ obligatoire.')
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
    confirmPassword: z.string().min(1, 'Champ obligatoire.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
