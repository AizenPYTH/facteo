import type { ProductFormValues } from '@/types/product';
import type { ProductInsert } from '@/types/database';

function toNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseDecimalInput(value: string): number {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
  return Number.parseFloat(normalized);
}

export function mapFormValuesToProductInsert(
  userId: string,
  input: ProductFormValues,
): ProductInsert {
  return {
    user_id: userId,
    name: input.name.trim(),
    description: toNullableString(input.description),
    unit_price: parseDecimalInput(input.unitPrice),
    vat_rate: parseDecimalInput(input.vatRate),
    unit: input.unit.trim(),
    updated_at: new Date().toISOString(),
  };
}
