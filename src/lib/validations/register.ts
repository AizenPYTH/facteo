import { z } from 'zod';

/** Slim register — identity + password. Company lives in onboarding. */
export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Champ obligatoire.'),
    lastName: z.string().trim().min(1, 'Champ obligatoire.'),
    email: z
      .string()
      .trim()
      .min(1, 'Champ obligatoire.')
      .email('Adresse e-mail invalide.'),
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
