import { mapQuoteLinesToInvoiceLines } from '@/lib/documents/line-mappers';
import {
  mapCreateInvoiceInputToInsert,
  mapUpdateInvoiceInputToInsert,
} from '@/lib/invoices/mappers';
import { resolveInvoiceStatusFromPayments } from '@/lib/invoices/status';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import {
  mapInvoiceDetail,
  mapInvoiceRevisionRow,
  mapInvoiceRowToInvoice,
} from '@/lib/supabase/mappers';
import { fetchQuoteById } from '@/lib/supabase/quotes';
import {
  computeDueDate,
  fetchSettings,
  reserveNextCreditNoteNumber,
  reserveNextInvoiceNumber,
} from '@/lib/supabase/settings';
import {
  canConvertInvoiceToCreditNote,
  canCorrectInvoice,
  createLocalInvoiceLineId,
  type CreateInvoiceInput,
  type Invoice,
  type InvoiceDetail,
  type InvoicePayment,
  type InvoiceRevision,
  type InvoiceStatus,
  type UpdateInvoiceInput,
} from '@/types/invoice';
import {
  INVOICES_PAGE_SIZE,
  type InvoicesPage,
  type InvoicesPageParams,
} from '@/types/invoices-list';
import type { DataScope } from '@/types/tenant';
import type {
  InvoiceItemInsert,
  InvoiceItemRow,
  InvoicePaymentRow,
  InvoiceRevisionInsert,
  InvoiceWithClient,
  InvoiceInsert,
} from '@/types/database';

export { INVOICES_PAGE_SIZE };

export const INVOICE_COLUMNS =
  'id, user_id, client_id, quote_id, number, status, document_kind, credit_of_invoice_id, vat_regime, revision, subtotal_ht, total_vat, total_ttc, total, issued_at, due_at, paid_at, payment_method, payment_reference, notes, stripe_payment_link, created_at, updated_at' as const;

export const INVOICE_LIST_COLUMNS = `${INVOICE_COLUMNS}, clients(name, company, email)` as const;

const INVOICE_ITEM_COLUMNS =
  'id, invoice_id, user_id, product_id, position, description, quantity, unit, unit_price, vat_rate, discount_percent, line_total_ht, created_at, updated_at' as const;

const PAYMENT_COLUMNS =
  'id, invoice_id, user_id, amount, paid_at, payment_method, payment_reference, notes, created_at' as const;

function sanitizeSearchTerm(search: string): string {
  return search.trim().replace(/[%_,]/g, '');
}

function applySearchFilter<T extends { or: (filters: string) => T }>(
  query: T,
  search: string,
): T {
  const sanitizedSearch = sanitizeSearchTerm(search);

  if (!sanitizedSearch) {
    return query;
  }

  return query.or(
    `number.ilike.%${sanitizedSearch}%,notes.ilike.%${sanitizedSearch}%`,
  );
}

async function insertInvoiceItems(
  invoiceId: string,
  lines: Omit<InvoiceItemInsert, 'invoice_id'>[],
): Promise<void> {
  if (lines.length === 0) {
    return;
  }

  const inserts: InvoiceItemInsert[] = lines.map((line) => ({
    ...line,
    invoice_id: invoiceId,
  }));

  const { error } = await supabase.from('invoice_items').insert(inserts);

  if (error) {
    logSupabaseError('insertInvoiceItems', error);
    throw error;
  }
}

async function replaceInvoiceItems(
  scope: DataScope,
  invoiceId: string,
  lines: Omit<InvoiceItemInsert, 'invoice_id'>[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('invoice_items')
    .delete()
    .eq('invoice_id', invoiceId)
    .eq('user_id', scope.userId);

  if (deleteError) {
    logSupabaseError('replaceInvoiceItems.delete', deleteError);
    throw deleteError;
  }

  await insertInvoiceItems(invoiceId, lines);
}

async function fetchInvoicePayments(
  scope: DataScope,
  invoiceId: string,
): Promise<InvoicePaymentRow[]> {
  const { data, error } = await supabase
    .from('invoice_payments')
    .select(PAYMENT_COLUMNS)
    .eq('invoice_id', invoiceId)
    .eq('user_id', scope.userId)
    .order('paid_at', { ascending: false });

  if (error) {
    logSupabaseError('fetchInvoicePayments', error);
    return [];
  }

  return (data ?? []) as InvoicePaymentRow[];
}

async function syncInvoicePaymentStatus(
  scope: DataScope,
  invoice: Pick<InvoiceDetail, 'id' | 'status' | 'totalTtc' | 'dueAt'>,
  payments: InvoicePaymentRow[],
): Promise<InvoiceStatus> {
  if (invoice.status === 'draft' || invoice.status === 'canceled') {
    return invoice.status;
  }

  const amountPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const nextStatus = resolveInvoiceStatusFromPayments({
    currentStatus: invoice.status,
    totalTtc: invoice.totalTtc,
    amountPaid,
    dueAt: invoice.dueAt,
  });

  if (nextStatus === invoice.status) {
    return invoice.status;
  }

  const now = new Date().toISOString();
  const latestPayment = payments[0];
  const payload: Partial<InvoiceInsert> = {
    status: nextStatus,
    updated_at: now,
  };

  if (nextStatus === 'paid') {
    payload.paid_at = latestPayment?.paid_at ?? now;
    payload.payment_method = latestPayment?.payment_method ?? null;
    payload.payment_reference = latestPayment?.payment_reference ?? null;
  } else if (invoice.status === 'paid') {
    payload.paid_at = null;
    payload.payment_method = null;
    payload.payment_reference = null;
  }

  const { error } = await supabase
    .from('invoices')
    .update(payload)
    .eq('id', invoice.id)
    .eq('company_id', scope.companyId);

  if (error) {
    logSupabaseError('syncInvoicePaymentStatus', error);
    return invoice.status;
  }

  return nextStatus;
}

export async function fetchInvoicesPage(
  scope: DataScope,
  {
    search = '',
    status = 'all',
    due = 'all',
    page = 0,
    pageSize = INVOICES_PAGE_SIZE,
  }: InvoicesPageParams = {},
): Promise<InvoicesPage> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('invoices')
    .select(INVOICE_LIST_COLUMNS, { count: 'exact' })
    .eq('company_id', scope.companyId)
    .order('issued_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (due === 'week') {
    const weekStart = new Date();
    const day = weekStart.getDay();
    const diff = day === 0 ? 6 : day - 1;
    weekStart.setDate(weekStart.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    query = query
      .in('status', ['sent', 'partially_paid', 'overdue'])
      .gte('due_at', weekStart.toISOString())
      .lt('due_at', weekEnd.toISOString());
  } else if (status !== 'all') {
    query = query.eq('status', status);
  }

  query = applySearchFilter(query, search);

  const { data, error, count } = await query;

  if (error) {
    logSupabaseError('fetchInvoicesPage', error);
    return { invoices: [], nextPage: null, totalCount: null };
  }

  const invoices =
    (data as unknown as InvoiceWithClient[] | null)?.map(mapInvoiceRowToInvoice) ?? [];
  const loadedCount = from + invoices.length;
  const hasMore = count !== null ? loadedCount < count : invoices.length === pageSize;

  return {
    invoices,
    nextPage: hasMore ? page + 1 : null,
    totalCount: count,
  };
}

/** Documents for a single client — CRM history on mobile detail. */
export async function fetchInvoicesForClient(
  scope: DataScope,
  clientId: string,
  limit = 50,
): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(INVOICE_LIST_COLUMNS)
    .eq('company_id', scope.companyId)
    .eq('client_id', clientId)
    .order('issued_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logSupabaseError('fetchInvoicesForClient', error);
    return [];
  }

  return (data as unknown as InvoiceWithClient[] | null)?.map(mapInvoiceRowToInvoice) ?? [];
}

export async function fetchInvoiceById(
  scope: DataScope,
  invoiceId: string,
): Promise<InvoiceDetail | null> {
  const { data: invoiceRow, error: invoiceError } = await supabase
    .from('invoices')
    .select(INVOICE_LIST_COLUMNS)
    .eq('id', invoiceId)
    .eq('company_id', scope.companyId)
    .maybeSingle();

  if (invoiceError) {
    logSupabaseError('fetchInvoiceById', invoiceError);
    return null;
  }

  if (!invoiceRow) {
    return null;
  }

  const [{ data: items, error: itemsError }, payments] = await Promise.all([
    supabase
      .from('invoice_items')
      .select(INVOICE_ITEM_COLUMNS)
      .eq('invoice_id', invoiceId)
      .eq('user_id', scope.userId)
      .order('position', { ascending: true }),
    fetchInvoicePayments(scope, invoiceId),
  ]);

  if (itemsError) {
    logSupabaseError('fetchInvoiceItems', itemsError);
    return null;
  }

  const typedRow = invoiceRow as unknown as InvoiceWithClient;
  let detail = mapInvoiceDetail(typedRow, (items ?? []) as InvoiceItemRow[], payments);
  const syncedStatus = await syncInvoicePaymentStatus(scope, detail, payments);

  if (syncedStatus !== detail.status) {
    const refreshed = await supabase
      .from('invoices')
      .select(INVOICE_LIST_COLUMNS)
      .eq('id', invoiceId)
      .eq('company_id', scope.companyId)
      .maybeSingle();

    if (refreshed.data) {
      detail = mapInvoiceDetail(
        refreshed.data as unknown as InvoiceWithClient,
        (items ?? []) as InvoiceItemRow[],
        payments,
      );
    } else {
      detail = { ...detail, status: syncedStatus };
    }
  }

  return detail;
}

export async function createInvoice(scope: DataScope, input: CreateInvoiceInput): Promise<Invoice> {
  if (!input.clientId) {
    throw new Error('Client is required.');
  }

  if (input.lines.length === 0) {
    throw new Error('Invoice must have at least one line.');
  }

  const settings = await fetchSettings(scope);
  const number = await reserveNextInvoiceNumber(scope.companyId);
  const defaultDueAt =
    input.dueAt ?? computeDueDate(input.paymentTermsDays ?? settings?.paymentTermsDays ?? 30);
  const { invoice, lines } = mapCreateInvoiceInputToInsert(scope, number, input, defaultDueAt);

  const { data: createdInvoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert(invoice)
    .select(INVOICE_COLUMNS)
    .single();

  if (invoiceError || !createdInvoice) {
    logSupabaseError('createInvoice', invoiceError);
    throw invoiceError ?? new Error('Unable to create invoice.');
  }

  const invoiceRow = createdInvoice as unknown as InvoiceWithClient;

  try {
    await insertInvoiceItems(invoiceRow.id, lines);
  } catch (error) {
    await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceRow.id)
      .eq('company_id', scope.companyId);
    throw error;
  }

  const { data: fullInvoice, error: fetchError } = await supabase
    .from('invoices')
    .select(INVOICE_LIST_COLUMNS)
    .eq('id', invoiceRow.id)
    .eq('company_id', scope.companyId)
    .single();

  if (fetchError || !fullInvoice) {
    return mapInvoiceRowToInvoice({ ...invoiceRow, clients: null });
  }

  return mapInvoiceRowToInvoice(fullInvoice as unknown as InvoiceWithClient);
}

export async function updateInvoice(
  scope: DataScope,
  invoiceId: string,
  input: UpdateInvoiceInput,
): Promise<InvoiceDetail> {
  const existing = await fetchInvoiceById(scope, invoiceId);

  if (!existing) {
    throw new Error('Invoice not found.');
  }

  if (existing.status !== 'draft') {
    throw new Error('Invoice is not editable.');
  }

  if (!input.clientId || input.lines.length === 0) {
    throw new Error('Invoice must have at least one line.');
  }

  if (
    typeof input.expectedRevision === 'number' &&
    input.expectedRevision !== existing.revision
  ) {
    throw new Error('Invoice revision conflict.');
  }

  const nextRevision = existing.revision + 1;
  const { invoice, lines } = mapUpdateInvoiceInputToInsert(
    scope,
    input,
    existing.issuedAt,
    existing.dueAt,
  );

  const payload: Partial<InvoiceInsert> = {
    ...invoice,
    revision: nextRevision,
  };

  let updateQuery = supabase
    .from('invoices')
    .update(payload)
    .eq('id', invoiceId)
    .eq('company_id', scope.companyId)
    .eq('status', 'draft');

  if (typeof input.expectedRevision === 'number') {
    updateQuery = updateQuery.eq('revision', input.expectedRevision);
  }

  const { data: updatedRow, error } = await updateQuery.select('id').maybeSingle();

  if (error) {
    logSupabaseError('updateInvoice', error);
    throw error;
  }

  if (!updatedRow) {
    if (typeof input.expectedRevision === 'number') {
      throw new Error('Invoice revision conflict.');
    }
    throw new Error('Invoice is not editable.');
  }

  await replaceInvoiceItems(scope, invoiceId, lines);

  await saveInvoiceRevision(
    scope,
    invoiceId,
    input.revisionReason ?? 'Brouillon mis à jour',
    {
      number: existing.number,
      status: existing.status,
      documentKind: existing.documentKind,
      vatRegime: existing.vatRegime,
      revision: existing.revision,
      clientId: existing.clientId,
      lines: existing.lines,
      notes: existing.notes,
      issuedAt: existing.issuedAt,
      dueAt: existing.dueAt,
      subtotalHt: existing.subtotalHt,
      totalVat: existing.totalVat,
      totalTtc: existing.totalTtc,
    },
    existing.revision,
  );

  const updated = await fetchInvoiceById(scope, invoiceId);

  if (!updated) {
    throw new Error('Unable to fetch updated invoice.');
  }

  return updated;
}

export async function saveInvoiceRevision(
  scope: DataScope,
  invoiceId: string,
  reason: string,
  snapshot: Record<string, unknown>,
  revision?: number,
): Promise<void> {
  const resolvedRevision =
    typeof revision === 'number'
      ? revision
      : ((await fetchInvoiceById(scope, invoiceId))?.revision ?? null);

  if (resolvedRevision == null) {
    throw new Error('Invoice not found.');
  }

  const insert: InvoiceRevisionInsert = {
    invoice_id: invoiceId,
    user_id: scope.userId,
    company_id: scope.companyId,
    revision: resolvedRevision,
    reason: reason.trim() || null,
    snapshot,
  };

  const { error } = await supabase.from('invoice_revisions').insert(insert);

  if (error) {
    logSupabaseError('saveInvoiceRevision', error);
    throw error;
  }
}

export async function fetchInvoiceRevisions(
  scope: DataScope,
  invoiceId: string,
): Promise<InvoiceRevision[]> {
  const { data, error } = await supabase
    .from('invoice_revisions')
    .select('id, invoice_id, user_id, company_id, revision, reason, snapshot, created_at')
    .eq('invoice_id', invoiceId)
    .eq('company_id', scope.companyId)
    .order('created_at', { ascending: false });

  if (error) {
    logSupabaseError('fetchInvoiceRevisions', error);
    return [];
  }

  return (data ?? []).map(mapInvoiceRevisionRow);
}

function negateInvoiceLines(lines: InvoiceDetail['lines']): InvoiceDetail['lines'] {
  return lines.map((line) => {
    const quantity = Number(String(line.quantity).replace(',', '.'));
    const negatedQuantity = Number.isFinite(quantity) ? -Math.abs(quantity) : -1;

    return {
      ...line,
      id: createLocalInvoiceLineId(),
      quantity: String(negatedQuantity),
    };
  });
}

export async function createCreditNoteFromInvoice(
  scope: DataScope,
  invoiceId: string,
): Promise<Invoice> {
  const source = await fetchInvoiceById(scope, invoiceId);

  if (!source || !source.clientId) {
    throw new Error('Invoice not found.');
  }

  if (source.documentKind === 'credit_note') {
    throw new Error('Cannot create a credit note from another credit note.');
  }

  if (!canConvertInvoiceToCreditNote(source.status)) {
    throw new Error('Invoice cannot be converted to a credit note.');
  }

  const number = await reserveNextCreditNoteNumber(scope.companyId);
  const { invoice, lines } = mapCreateInvoiceInputToInsert(
    scope,
    number,
    {
      clientId: source.clientId,
      quoteId: source.quoteId,
      lines: negateInvoiceLines(source.lines),
      issuedAt: new Date().toISOString(),
      dueAt: source.dueAt,
      notes: source.notes
        ? `Avoir sur ${source.number}\n${source.notes}`
        : `Avoir sur ${source.number}`,
      vatRegime: source.vatRegime,
      documentKind: 'credit_note',
      creditOfInvoiceId: source.id,
    },
    source.dueAt,
  );

  const { data: createdInvoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert(invoice)
    .select(INVOICE_COLUMNS)
    .single();

  if (invoiceError || !createdInvoice) {
    logSupabaseError('createCreditNoteFromInvoice', invoiceError);
    throw invoiceError ?? new Error('Unable to create credit note.');
  }

  const invoiceRow = createdInvoice as unknown as InvoiceWithClient;

  try {
    await insertInvoiceItems(invoiceRow.id, lines);
  } catch (error) {
    await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceRow.id)
      .eq('company_id', scope.companyId);
    throw error;
  }

  const { data: fullInvoice, error: fetchError } = await supabase
    .from('invoices')
    .select(INVOICE_LIST_COLUMNS)
    .eq('id', invoiceRow.id)
    .eq('company_id', scope.companyId)
    .single();

  if (fetchError || !fullInvoice) {
    return mapInvoiceRowToInvoice({ ...invoiceRow, clients: null });
  }

  return mapInvoiceRowToInvoice(fullInvoice as unknown as InvoiceWithClient);
}

export async function correctInvoice(
  scope: DataScope,
  invoiceId: string,
): Promise<{ creditNote: Invoice; correctedInvoice: Invoice }> {
  const source = await fetchInvoiceById(scope, invoiceId);

  if (!source || !source.clientId) {
    throw new Error('Invoice not found.');
  }

  if (source.documentKind === 'credit_note') {
    throw new Error('Cannot correct a credit note.');
  }

  if (!canCorrectInvoice(source.status)) {
    throw new Error('Invoice cannot be corrected.');
  }

  const creditNote = await createCreditNoteFromInvoice(scope, invoiceId);
  const correctedInvoice = await createInvoice(scope, {
    clientId: source.clientId,
    quoteId: source.quoteId,
    lines: source.lines.map((line) => ({
      ...line,
      id: createLocalInvoiceLineId(),
    })),
    issuedAt: new Date().toISOString(),
    dueAt: source.dueAt,
    notes: source.notes ?? undefined,
    vatRegime: source.vatRegime,
    documentKind: 'invoice',
  });

  return { creditNote, correctedInvoice };
}

export async function duplicateInvoice(scope: DataScope, invoiceId: string): Promise<Invoice> {
  const source = await fetchInvoiceById(scope, invoiceId);

  if (!source || !source.clientId) {
    throw new Error('Invoice not found.');
  }

  return createInvoice(scope, {
    clientId: source.clientId,
    lines: source.lines.map((line) => ({
      ...line,
      id: createLocalInvoiceLineId(),
    })),
    issuedAt: source.issuedAt,
    dueAt: source.dueAt,
    notes: source.notes ?? undefined,
    vatRegime: source.vatRegime,
    documentKind: 'invoice',
  });
}

export async function updateInvoiceStatus(
  scope: DataScope,
  invoiceId: string,
  status: InvoiceStatus,
): Promise<Invoice> {
  const now = new Date().toISOString();
  const payload: Partial<InvoiceInsert> = { status, updated_at: now };

  if (status === 'paid') {
    payload.paid_at = now;
  }

  if (status === 'canceled' || status === 'sent') {
    payload.paid_at = null;
    payload.payment_method = null;
    payload.payment_reference = null;
  }

  const { data: updatedRow, error } = await supabase
    .from('invoices')
    .update(payload)
    .eq('id', invoiceId)
    .eq('company_id', scope.companyId)
    .select('id')
    .maybeSingle();

  if (error) {
    logSupabaseError('updateInvoiceStatus', error);
    throw error;
  }

  if (!updatedRow) {
    throw new Error('Invoice not found.');
  }

  const { data, error: fetchError } = await supabase
    .from('invoices')
    .select(INVOICE_LIST_COLUMNS)
    .eq('id', invoiceId)
    .eq('company_id', scope.companyId)
    .single();

  if (fetchError || !data) {
    throw fetchError ?? new Error('Unable to fetch invoice.');
  }

  return mapInvoiceRowToInvoice(data as unknown as InvoiceWithClient);
}

export async function cancelInvoice(scope: DataScope, invoiceId: string): Promise<Invoice> {
  return updateInvoiceStatus(scope, invoiceId, 'canceled');
}

/**
 * Permanently delete a draft invoice. Non-draft invoices must be canceled instead.
 * Uses existing RLS delete policies — no schema change.
 */
export async function deleteInvoice(scope: DataScope, invoiceId: string): Promise<void> {
  const existing = await fetchInvoiceById(scope, invoiceId);

  if (!existing) {
    throw new Error('Invoice not found.');
  }

  if (existing.status !== 'draft') {
    throw new Error('Only draft invoices can be deleted.');
  }

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .delete()
    .eq('invoice_id', invoiceId)
    .eq('user_id', scope.userId);

  if (itemsError) {
    logSupabaseError('deleteInvoiceItems', itemsError);
    throw itemsError;
  }

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId)
    .eq('company_id', scope.companyId);

  if (error) {
    logSupabaseError('deleteInvoice', error);
    throw error;
  }
}

export async function markInvoiceAsPaid(
  scope: DataScope,
  invoiceId: string,
  paymentMethod?: string,
  paymentReference?: string,
): Promise<InvoiceDetail> {
  const invoice = await fetchInvoiceById(scope, invoiceId);

  if (!invoice) {
    throw new Error('Invoice not found.');
  }

  if (invoice.amountDue > 0) {
    await addInvoicePayment(scope, invoiceId, {
      amount: invoice.amountDue,
      paymentMethod: paymentMethod ?? null,
      paymentReference: paymentReference ?? null,
    });
  } else {
    await updateInvoiceStatus(scope, invoiceId, 'paid');
  }

  const updated = await fetchInvoiceById(scope, invoiceId);

  if (!updated) {
    throw new Error('Unable to fetch invoice.');
  }

  return updated;
}

export type AddPaymentInput = {
  amount: number;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  notes?: string | null;
  paidAt?: string;
};

export async function addInvoicePayment(
  scope: DataScope,
  invoiceId: string,
  input: AddPaymentInput,
): Promise<InvoicePayment> {
  const invoice = await fetchInvoiceById(scope, invoiceId);

  if (!invoice) {
    throw new Error('Invoice not found.');
  }

  if (invoice.amountDue <= 0) {
    throw new Error('Invoice is already paid.');
  }

  if (input.amount <= 0 || input.amount > invoice.amountDue + 0.01) {
    throw new Error('Invalid payment amount.');
  }

  const { data, error } = await supabase
    .from('invoice_payments')
    .insert({
      invoice_id: invoiceId,
      user_id: scope.userId,
      amount: input.amount,
      paid_at: input.paidAt ?? new Date().toISOString(),
      payment_method: input.paymentMethod ?? null,
      payment_reference: input.paymentReference ?? null,
      notes: input.notes ?? null,
    })
    .select(PAYMENT_COLUMNS)
    .single();

  if (error || !data) {
    logSupabaseError('addInvoicePayment', error);
    throw error ?? new Error('Unable to add payment.');
  }

  const payments = await fetchInvoicePayments(scope, invoiceId);
  await syncInvoicePaymentStatus(scope, invoice, payments);

  return {
    id: data.id,
    invoiceId: data.invoice_id,
    amount: data.amount,
    paidAt: data.paid_at,
    paymentMethod: data.payment_method,
    paymentReference: data.payment_reference,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

export async function convertQuoteToInvoice(
  scope: DataScope,
  quoteId: string,
): Promise<Invoice> {
  const quote = await fetchQuoteById(scope, quoteId);

  if (!quote) {
    throw new Error('Quote not found.');
  }

  if (quote.status === 'converted') {
    throw new Error('Quote already converted.');
  }

  if (quote.status === 'rejected' || quote.status === 'expired') {
    throw new Error('Quote cannot be converted.');
  }

  if (!quote.clientId) {
    throw new Error('Client is required.');
  }

  const invoice = await createInvoice(scope, {
    clientId: quote.clientId,
    quoteId: quote.id,
    lines: mapQuoteLinesToInvoiceLines(quote.lines),
    issuedAt: quote.issuedAt,
    dueAt: quote.validUntil,
    paymentTermsDays: quote.paymentTermsDays,
    notes: quote.notes ?? undefined,
  });

  const now = new Date().toISOString();

  const { error: quoteError } = await supabase
    .from('quotes')
    .update({
      status: 'converted',
      converted_invoice_id: invoice.id,
      updated_at: now,
    })
    .eq('id', quoteId)
    .eq('company_id', scope.companyId);

  if (quoteError) {
    logSupabaseError('convertQuoteToInvoice.updateQuote', quoteError);
    await supabase
      .from('invoices')
      .delete()
      .eq('id', invoice.id)
      .eq('company_id', scope.companyId);
    throw quoteError;
  }

  return invoice;
}
