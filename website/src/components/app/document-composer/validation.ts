import type { InvoiceLineValue } from '@facteo/types/invoice';
import type { QuoteLineValue } from '@facteo/types/quote';

export type LineValue = QuoteLineValue | InvoiceLineValue;

export type FieldErrors = {
  clientId?: string;
  linesGlobal?: string;
  lineErrors?: Record<string, { description?: string; quantity?: string; unitPrice?: string }>;
};

function parseDecimal(value: string): number | null {
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  if (!normalized.trim()) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateDocumentDraft(clientId: string, lines: LineValue[]): FieldErrors {
  const errors: FieldErrors = {};

  if (!clientId.trim()) {
    errors.clientId = 'Sélectionnez un client pour continuer.';
  }

  const filledLines = lines.filter((line) => line.description.trim());
  if (filledLines.length === 0) {
    errors.linesGlobal = 'Ajoutez au moins une prestation ou un produit.';
  }

  const lineErrors: Record<string, { description?: string; quantity?: string; unitPrice?: string }> =
    {};

  for (const line of lines) {
    if (!line.description.trim()) continue;

    const row: { description?: string; quantity?: string; unitPrice?: string } = {};
    const qty = parseDecimal(line.quantity);
    const price = parseDecimal(line.unitPrice);

    if (qty === null || qty <= 0) {
      row.quantity = 'Quantité invalide.';
    }
    if (price === null || price < 0) {
      row.unitPrice = 'Prix invalide.';
    }

    if (Object.keys(row).length > 0) {
      lineErrors[line.id] = row;
    }
  }

  if (Object.keys(lineErrors).length > 0) {
    errors.lineErrors = lineErrors;
  }

  return errors;
}

export function hasValidationErrors(errors: FieldErrors): boolean {
  return Boolean(
    errors.clientId ||
      errors.linesGlobal ||
      (errors.lineErrors && Object.keys(errors.lineErrors).length > 0),
  );
}

export type ErrorTarget =
  | { type: 'client' }
  | { type: 'lines' }
  | { type: 'line'; lineId: string; field: 'description' | 'quantity' | 'unitPrice' };

export function getFirstErrorTarget(errors: FieldErrors, lines: LineValue[]): ErrorTarget | null {
  if (errors.clientId) return { type: 'client' };
  if (errors.linesGlobal) return { type: 'lines' };

  if (errors.lineErrors) {
    for (const line of lines) {
      const row = errors.lineErrors[line.id];
      if (!row) continue;
      if (row.description) return { type: 'line', lineId: line.id, field: 'description' };
      if (row.quantity) return { type: 'line', lineId: line.id, field: 'quantity' };
      if (row.unitPrice) return { type: 'line', lineId: line.id, field: 'unitPrice' };
    }
  }

  return null;
}
