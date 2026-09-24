import { readErrorMessage } from '@/lib/domain/ai/product-image-analysis';
import { supabase } from '@/lib/supabase';

/** Ligne telle que recopiée par l'IA : aucun montant n'est calculé côté serveur. */
export type AnalyzedInvoiceLine = {
  title: string;
  description: string;
  quantity: number | null;
  unit: string;
  unit_price: number | null;
  price_kind: 'ht' | 'ttc' | 'unknown';
  vat_rate: number | null;
  line_total: number | null;
};

export type AnalyzedInvoice = {
  client_name: string;
  client_address: string;
  issued_date: string | null;
  reference: string;
  lines: AnalyzedInvoiceLine[];
};

/** Découpe une capture en factures (écran « Créer plusieurs factures »). */
export async function analyzeInvoicesImage(input: {
  imageBase64: string;
  mimeType: string;
}): Promise<AnalyzedInvoice[]> {
  const { data, error } = await supabase.functions.invoke<{ invoices?: AnalyzedInvoice[] }>(
    'analyze-product-image',
    { body: { imageBase64: input.imageBase64, mimeType: input.mimeType, mode: 'invoices' } },
  );

  if (error) {
    throw new Error(await readErrorMessage(error));
  }

  if (!data || !Array.isArray(data.invoices)) {
    // Fonction pas encore redéployée : elle répond encore au format « produits ».
    throw new Error(
      'La fonction IA doit être redéployée pour reconnaître plusieurs factures (analyze-product-image).',
    );
  }

  return data.invoices;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Seul endroit où l'on calcule : de façon déterministe, dans le code, jamais
 * par l'IA. Les factures stockent un prix unitaire HT à 2 décimales ; un prix
 * TTC imprimé est donc converti, ce qui peut décaler le total d'un centime.
 */
export function toInvoiceLineValues(line: AnalyzedInvoiceLine): {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
} {
  const quantity = line.quantity && line.quantity > 0 ? line.quantity : 1;
  const printedUnit =
    line.unit_price ?? (line.line_total !== null ? line.line_total / quantity : 0);
  const vatRate = line.vat_rate ?? 20;
  const unitHt = line.price_kind === 'ht' ? printedUnit : printedUnit / (1 + vatRate / 100);

  return {
    description: [line.title, line.description].filter(Boolean).join(' — '),
    quantity: String(quantity),
    unit: line.unit || 'unité',
    unitPrice: String(round2(unitHt)),
    vatRate: String(vatRate),
  };
}
