import { calculateLineTotals } from '@/lib/calculations/totals';
import { parseAmountInput, parseVatRateForTotals } from '@/lib/format/decimal';
import { billingErrorMessage } from '@/lib/quotes/billing-errors';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';

/**
 * Acomptes et solde d'un devis. Les calculs et les garde-fous (pas de double
 * facturation, pas d'acompte compté deux fois) sont faits en base : le site et
 * l'application obtiennent exactement le même résultat.
 */

export type BillingRole = 'standard' | 'deposit' | 'balance';

export type QuoteBillingInvoice = {
  id: string;
  number: string;
  role: BillingRole;
  status: string;
  totalTtc: number;
  amountPaid: number;
  depositPercent: number | null;
  issuedAt: string | null;
  active: boolean;
};

export type QuoteBillingState = {
  quoteId: string;
  quoteNumber: string;
  quoteStatus: string;
  quoteTotalTtc: number;
  invoices: QuoteBillingInvoice[];
  depositsTotalTtc: number;
  depositsPaid: number;
  finalInvoiceId: string | null;
  finalInvoiceRole: BillingRole | null;
  remainingTtc: number;
  canCreateDeposit: boolean;
  canCreateFinal: boolean;
};

export type DepositMode = 'percent' | 'amount';

export type CreatedBillingInvoice = {
  id: string;
  number: string;
  totalTtc: number;
  role: BillingRole;
};

export class QuoteBillingError extends Error {}

const num = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function toRole(value: unknown): BillingRole {
  return value === 'deposit' || value === 'balance' ? value : 'standard';
}

export function parseQuoteBillingState(raw: unknown): QuoteBillingState | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const invoices = Array.isArray(data.invoices) ? (data.invoices as Record<string, unknown>[]) : [];
  return {
    quoteId: String(data.quote_id ?? ''),
    quoteNumber: String(data.quote_number ?? ''),
    quoteStatus: String(data.quote_status ?? ''),
    quoteTotalTtc: num(data.quote_total_ttc),
    invoices: invoices.map((invoice) => ({
      id: String(invoice.id ?? ''),
      number: String(invoice.number ?? ''),
      role: toRole(invoice.role),
      status: String(invoice.status ?? ''),
      totalTtc: num(invoice.total_ttc),
      amountPaid: num(invoice.amount_paid),
      depositPercent: invoice.deposit_percent === null || invoice.deposit_percent === undefined ? null : num(invoice.deposit_percent),
      issuedAt: typeof invoice.issued_at === 'string' ? invoice.issued_at : null,
      active: invoice.active !== false,
    })),
    depositsTotalTtc: num(data.deposits_total_ttc),
    depositsPaid: num(data.deposits_paid),
    finalInvoiceId: typeof data.final_invoice_id === 'string' ? data.final_invoice_id : null,
    finalInvoiceRole: data.final_invoice_role ? toRole(data.final_invoice_role) : null,
    remainingTtc: num(data.remaining_ttc),
    canCreateDeposit: data.can_create_deposit === true,
    canCreateFinal: data.can_create_final === true,
  };
}

export async function fetchQuoteBillingState(quoteId: string): Promise<QuoteBillingState | null> {
  const { data, error } = await supabase.rpc('quote_billing_state', { p_quote_id: quoteId });
  if (error) {
    logSupabaseError('fetchQuoteBillingState', error);
    return null;
  }
  return parseQuoteBillingState(data);
}

function parseCreated(raw: unknown, fallbackRole: BillingRole): CreatedBillingInvoice {
  const data = (raw ?? {}) as Record<string, unknown>;
  if (typeof data.id !== 'string') {
    throw new QuoteBillingError('L’opération a échoué. Réessayez.');
  }
  return {
    id: data.id,
    number: String(data.number ?? ''),
    totalTtc: num(data.total_ttc),
    role: data.role ? toRole(data.role) : fallbackRole,
  };
}

/** Facture d'acompte : pourcentage du devis ou montant TTC. */
export async function createDepositInvoice(
  quoteId: string,
  mode: DepositMode,
  value: number,
): Promise<CreatedBillingInvoice> {
  const { data, error } = await supabase.rpc('create_deposit_invoice', {
    p_quote_id: quoteId,
    p_mode: mode,
    p_value: value,
  });
  if (error) {
    logSupabaseError('createDepositInvoice', error);
    throw new QuoteBillingError(billingErrorMessage(error));
  }
  return parseCreated(data, 'deposit');
}

/** Facture finale : solde (acomptes déduits) ou facture du devis entier. */
export async function createFinalInvoiceFromQuote(quoteId: string): Promise<CreatedBillingInvoice> {
  const { data, error } = await supabase.rpc('create_final_invoice_from_quote', { p_quote_id: quoteId });
  if (error) {
    logSupabaseError('createFinalInvoiceFromQuote', error);
    throw new QuoteBillingError(billingErrorMessage(error));
  }
  return parseCreated(data, 'standard');
}

/** Aperçu d'un acompte avant création (même calcul que la base). */
export function previewDepositTtc(
  vatGroups: { vatRate: number; ht: number }[],
  quoteTotalTtc: number,
  mode: DepositMode,
  value: number,
): number {
  if (!Number.isFinite(value) || value <= 0 || quoteTotalTtc <= 0) return 0;
  const ratio = mode === 'percent' ? value / 100 : value / quoteTotalTtc;
  const round = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;
  let subtotal = 0;
  let vat = 0;
  for (const group of vatGroups) {
    const ht = round(group.ht * ratio);
    subtotal += ht;
    vat += round((ht * group.vatRate) / 100);
  }
  return round(subtotal + vat);
}

export const BILLING_ROLE_LABELS: Record<BillingRole, string> = {
  standard: 'Facture',
  deposit: 'Facture d’acompte',
  balance: 'Facture de solde',
};

/** Montant HT du devis par taux de TVA (base du calcul des acomptes). */
export function quoteVatGroups(
  lines: { quantity: string; unitPrice: string; vatRate: string; discountPercent: string }[],
): { vatRate: number; ht: number }[] {
  const groups = new Map<number, number>();
  for (const line of lines) {
    const vatRate = parseVatRateForTotals(line.vatRate);
    const totals = calculateLineTotals(
      parseAmountInput(line.quantity),
      parseAmountInput(line.unitPrice),
      vatRate,
      parseAmountInput(line.discountPercent),
    );
    groups.set(vatRate, (groups.get(vatRate) ?? 0) + totals.lineTotalHt);
  }
  return [...groups.entries()].map(([vatRate, ht]) => ({ vatRate, ht: Math.round(ht * 100) / 100 }));
}
