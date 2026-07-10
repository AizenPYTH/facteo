import { z } from 'zod';

import { parseDecimalInput } from '@/lib/products/mappers';

const optionalText = z.string().trim();

function parseRequiredDecimal(value: string, fieldLabel: string) {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');

  if (!normalized) {
    return { success: false as const, message: `${fieldLabel} est requis` };
  }

  const parsed = Number.parseFloat(normalized);

  if (!Number.isFinite(parsed)) {
    return { success: false as const, message: `${fieldLabel} invalide` };
  }

  return { success: true as const, value: parsed };
}

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis'),
  description: optionalText,
  unitPrice: z
    .string()
    .trim()
    .min(1, 'Le prix HT est requis')
    .refine((value) => {
      const parsed = parseRequiredDecimal(value, 'Le prix HT');
      return parsed.success && parsed.value >= 0;
    }, 'Le prix HT doit être un montant positif ou nul'),
  vatRate: z
    .string()
    .trim()
    .min(1, 'La TVA est requise')
    .refine((value) => {
      const parsed = parseRequiredDecimal(value, 'La TVA');
      return parsed.success && parsed.value >= 0 && parsed.value <= 100;
    }, 'La TVA doit être comprise entre 0 et 100'),
  unit: z.string().trim().min(1, "L'unité est requise"),
});

export type ProductFormSchemaValues = z.infer<typeof productFormSchema>;

export { parseDecimalInput };
