import { getClientIdentityError } from '@/lib/clients/identity';
import { getClientDisplayName } from '@/lib/clients/name';
import { normalizeFrenchPhone } from '@/lib/format/phone';
import { mapLinesToDocumentTotals } from '@/lib/quotes/mappers';
import { mapInvoiceLinesToDocumentTotals } from '@/lib/invoices/mappers';
import {
  demoClients,
  demoCompany,
  demoInvoiceDetails,
  demoInvoices,
  demoProfile,
  demoQuoteDetails,
  demoQuotes,
  demoSettings,
} from '@/lib/screenshot-demo/fixtures';
import type { Client, ClientFormValues } from '@/types/client';
import type { UpdateCompanyProfileInput } from '@/types/company-profile';
import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceDetail,
  InvoicePayment,
  InvoiceStatus,
  UpdateInvoiceInput,
} from '@/types/invoice';
import type {
  CreateQuoteInput,
  Quote,
  QuoteDetail,
  QuoteStatus,
  UpdateQuoteInput,
} from '@/types/quote';
import type { Settings, SettingsFormValues } from '@/types/settings';
import type { TenantCompany } from '@/types/tenant';

type OfflinePaymentInput = {
  amount: number;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  notes?: string | null;
  paidAt?: string;
};

/** Entreprises démo mutables (création / liste offline). */
export const demoCompanies: TenantCompany[] = [demoCompany];

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveClientLabel(clientId: string | null | undefined): {
  clientName: string;
  clientEmail: string | null;
} {
  const client = clientId ? demoClients.find((row) => row.id === clientId) : undefined;
  if (!client) {
    return { clientName: 'Client', clientEmail: null };
  }
  return {
    clientName: getClientDisplayName(client),
    clientEmail: client.email,
  };
}

export function offlineCreateClient(input: ClientFormValues): Client {
  const identityError = getClientIdentityError(input);
  if (identityError) {
    throw new Error(identityError);
  }

  const timestamp = nowIso();
  const client: Client = {
    id: newId('client'),
    lastName: input.lastName.trim(),
    firstName: input.firstName.trim(),
    company: nullable(input.company),
    email: nullable(input.email),
    phone: nullable(normalizeFrenchPhone(input.phone)),
    address: nullable(input.address),
    postalCode: nullable(input.postalCode),
    city: nullable(input.city),
    country: nullable(input.country),
    siren: nullable(input.siren.replace(/\D/g, '')),
    siret: nullable(input.siret.replace(/\D/g, '')),
    vatNumber: nullable(input.vatNumber.replace(/\s/g, '').toUpperCase()),
    notes: nullable(input.notes),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  demoClients.unshift(client);
  return client;
}

export function offlineUpdateClient(clientId: string, input: ClientFormValues): Client {
  const identityError = getClientIdentityError(input);
  if (identityError) {
    throw new Error(identityError);
  }

  const index = demoClients.findIndex((row) => row.id === clientId);
  if (index < 0) {
    throw new Error('Client introuvable.');
  }

  const updated: Client = {
    ...demoClients[index],
    lastName: input.lastName.trim(),
    firstName: input.firstName.trim(),
    company: nullable(input.company),
    email: nullable(input.email),
    phone: nullable(normalizeFrenchPhone(input.phone)),
    address: nullable(input.address),
    postalCode: nullable(input.postalCode),
    city: nullable(input.city),
    country: nullable(input.country),
    siren: nullable(input.siren.replace(/\D/g, '')),
    siret: nullable(input.siret.replace(/\D/g, '')),
    vatNumber: nullable(input.vatNumber.replace(/\s/g, '').toUpperCase()),
    notes: nullable(input.notes),
    updatedAt: nowIso(),
  };
  demoClients[index] = updated;
  return updated;
}

export function offlineDeleteClient(clientId: string): void {
  const index = demoClients.findIndex((row) => row.id === clientId);
  if (index >= 0) {
    demoClients.splice(index, 1);
  }
}

export function offlineReserveQuoteNumber(): string {
  const number = `${demoSettings.quotePrefix}-${new Date().getFullYear()}-${String(
    demoSettings.nextQuoteNumber,
  ).padStart(3, '0')}`;
  demoSettings.nextQuoteNumber += 1;
  demoSettings.updatedAt = nowIso();
  return number;
}

export function offlineReserveInvoiceNumber(): string {
  const number = `${demoSettings.invoicePrefix}-${new Date().getFullYear()}-${String(
    demoSettings.nextInvoiceNumber,
  ).padStart(3, '0')}`;
  demoSettings.nextInvoiceNumber += 1;
  demoSettings.updatedAt = nowIso();
  return number;
}

export function offlineCreateQuote(input: CreateQuoteInput): Quote {
  if (!input.clientId) {
    throw new Error('Client is required.');
  }
  if (input.lines.length === 0) {
    throw new Error('Quote must have at least one line.');
  }

  const totals = mapLinesToDocumentTotals(input.lines);
  const timestamp = nowIso();
  const { clientName, clientEmail } = resolveClientLabel(input.clientId);
  const quote: Quote = {
    id: newId('quote'),
    clientId: input.clientId,
    clientName,
    clientEmail,
    convertedInvoiceId: null,
    number: offlineReserveQuoteNumber(),
    status: 'draft',
    subtotalHt: totals.subtotalHt,
    totalVat: totals.totalVat,
    totalTtc: totals.totalTtc,
    issuedAt: input.issuedAt ?? timestamp,
    validUntil: input.validUntil ?? null,
    paymentTermsDays: input.paymentTermsDays ?? demoSettings.paymentTermsDays,
    notes: input.notes?.trim() || null,
    internalNotes: input.internalNotes?.trim() || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  demoQuotes.unshift(quote);
  demoQuoteDetails[quote.id] = {
    ...quote,
    lines: input.lines.map((line) => ({ ...line })),
  };
  return quote;
}

export function offlineUpdateQuote(quoteId: string, input: UpdateQuoteInput): Quote {
  const index = demoQuotes.findIndex((row) => row.id === quoteId);
  if (index < 0) {
    throw new Error('Quote not found.');
  }
  if (demoQuotes[index].status !== 'draft') {
    throw new Error('Quote is not editable.');
  }
  if (!input.clientId || input.lines.length === 0) {
    throw new Error('Quote must have at least one line.');
  }

  const totals = mapLinesToDocumentTotals(input.lines);
  const { clientName, clientEmail } = resolveClientLabel(input.clientId);
  const updated: Quote = {
    ...demoQuotes[index],
    clientId: input.clientId,
    clientName,
    clientEmail,
    subtotalHt: totals.subtotalHt,
    totalVat: totals.totalVat,
    totalTtc: totals.totalTtc,
    issuedAt: input.issuedAt ?? demoQuotes[index].issuedAt,
    validUntil: input.validUntil ?? demoQuotes[index].validUntil,
    paymentTermsDays: input.paymentTermsDays ?? demoQuotes[index].paymentTermsDays,
    notes: input.notes?.trim() || null,
    internalNotes: input.internalNotes?.trim() || null,
    updatedAt: nowIso(),
  };

  demoQuotes[index] = updated;
  demoQuoteDetails[quoteId] = {
    ...updated,
    lines: input.lines.map((line) => ({ ...line })),
  };
  return updated;
}

export function offlineUpdateQuoteStatus(quoteId: string, status: QuoteStatus): Quote {
  const index = demoQuotes.findIndex((row) => row.id === quoteId);
  if (index < 0) {
    throw new Error('Quote not found.');
  }

  const updated: Quote = {
    ...demoQuotes[index],
    status,
    updatedAt: nowIso(),
  };
  demoQuotes[index] = updated;
  const detail = demoQuoteDetails[quoteId];
  if (detail) {
    demoQuoteDetails[quoteId] = { ...detail, ...updated };
  }
  return updated;
}

export function offlineDeleteQuote(quoteId: string): void {
  const index = demoQuotes.findIndex((row) => row.id === quoteId);
  if (index >= 0) {
    demoQuotes.splice(index, 1);
  }
  delete demoQuoteDetails[quoteId];
}

export function offlineGetQuoteDetail(quoteId: string): QuoteDetail | null {
  return demoQuoteDetails[quoteId] ?? null;
}

export function offlineCreateInvoice(input: CreateInvoiceInput, dueAt: string | null): Invoice {
  if (!input.clientId) {
    throw new Error('Client is required.');
  }
  if (input.lines.length === 0) {
    throw new Error('Invoice must have at least one line.');
  }

  const totals = mapInvoiceLinesToDocumentTotals(input.lines);
  const timestamp = nowIso();
  const { clientName, clientEmail } = resolveClientLabel(input.clientId);
  const invoice: Invoice = {
    id: newId('invoice'),
    clientId: input.clientId,
    clientName,
    clientEmail,
    quoteId: input.quoteId ?? null,
    number: offlineReserveInvoiceNumber(),
    status: 'draft',
    subtotalHt: totals.subtotalHt,
    totalVat: totals.totalVat,
    totalTtc: totals.totalTtc,
    issuedAt: input.issuedAt ?? timestamp,
    dueAt: input.dueAt ?? dueAt,
    paidAt: null,
    paymentMethod: null,
    paymentReference: null,
    notes: input.notes?.trim() || null,
    stripePaymentLink: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  demoInvoices.unshift(invoice);
  demoInvoiceDetails[invoice.id] = {
    ...invoice,
    lines: input.lines.map((line) => ({ ...line })),
    payments: [],
    amountPaid: 0,
    amountDue: invoice.totalTtc,
  };
  return invoice;
}

export function offlineUpdateInvoice(
  invoiceId: string,
  input: UpdateInvoiceInput,
): InvoiceDetail {
  const existing = demoInvoiceDetails[invoiceId];
  const index = demoInvoices.findIndex((row) => row.id === invoiceId);
  if (!existing || index < 0) {
    throw new Error('Invoice not found.');
  }
  if (existing.status !== 'draft') {
    throw new Error('Invoice is not editable.');
  }
  if (!input.clientId || input.lines.length === 0) {
    throw new Error('Invoice must have at least one line.');
  }

  const totals = mapInvoiceLinesToDocumentTotals(input.lines);
  const { clientName, clientEmail } = resolveClientLabel(input.clientId);
  const updated: Invoice = {
    ...demoInvoices[index],
    clientId: input.clientId,
    clientName,
    clientEmail,
    subtotalHt: totals.subtotalHt,
    totalVat: totals.totalVat,
    totalTtc: totals.totalTtc,
    issuedAt: input.issuedAt ?? existing.issuedAt,
    dueAt: input.dueAt ?? existing.dueAt,
    notes: input.notes?.trim() || null,
    updatedAt: nowIso(),
  };

  demoInvoices[index] = updated;
  const detail: InvoiceDetail = {
    ...updated,
    lines: input.lines.map((line) => ({ ...line })),
    payments: [],
    amountPaid: 0,
    amountDue: updated.totalTtc,
  };
  demoInvoiceDetails[invoiceId] = detail;
  return detail;
}

export function offlineUpdateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus,
): Invoice {
  const index = demoInvoices.findIndex((row) => row.id === invoiceId);
  const detail = demoInvoiceDetails[invoiceId];
  if (index < 0 || !detail) {
    throw new Error('Invoice not found.');
  }

  const timestamp = nowIso();
  const updated: Invoice = {
    ...demoInvoices[index],
    status,
    paidAt: status === 'paid' ? timestamp : null,
    paymentMethod: status === 'paid' ? demoInvoices[index].paymentMethod : null,
    paymentReference: status === 'paid' ? demoInvoices[index].paymentReference : null,
    updatedAt: timestamp,
  };

  if (status === 'canceled' || status === 'sent') {
    updated.paidAt = null;
    updated.paymentMethod = null;
    updated.paymentReference = null;
  }

  demoInvoices[index] = updated;
  demoInvoiceDetails[invoiceId] = {
    ...detail,
    ...updated,
    amountPaid: status === 'paid' ? updated.totalTtc : detail.amountPaid,
    amountDue: status === 'paid' ? 0 : updated.totalTtc - detail.amountPaid,
  };
  return updated;
}

export function offlineAddInvoicePayment(
  invoiceId: string,
  input: OfflinePaymentInput,
): InvoicePayment {
  const detail = demoInvoiceDetails[invoiceId];
  const index = demoInvoices.findIndex((row) => row.id === invoiceId);
  if (!detail || index < 0) {
    throw new Error('Invoice not found.');
  }
  if (detail.amountDue <= 0) {
    throw new Error('Invoice is already paid.');
  }
  if (input.amount <= 0 || input.amount > detail.amountDue + 0.01) {
    throw new Error('Invalid payment amount.');
  }

  const payment: InvoicePayment = {
    id: newId('pay'),
    invoiceId,
    amount: input.amount,
    paidAt: input.paidAt ?? nowIso(),
    paymentMethod: input.paymentMethod ?? null,
    paymentReference: input.paymentReference ?? null,
    notes: input.notes ?? null,
    createdAt: nowIso(),
  };

  const payments = [...detail.payments, payment];
  const amountPaid = payments.reduce((sum, row) => sum + row.amount, 0);
  const amountDue = Math.max(0, detail.totalTtc - amountPaid);
  const status: InvoiceStatus =
    amountDue <= 0.01 ? 'paid' : amountPaid > 0 ? 'partially_paid' : detail.status;

  const updatedInvoice: Invoice = {
    ...demoInvoices[index],
    status,
    paidAt: status === 'paid' ? payment.paidAt : null,
    paymentMethod: payment.paymentMethod,
    paymentReference: payment.paymentReference,
    updatedAt: nowIso(),
  };

  demoInvoices[index] = updatedInvoice;
  demoInvoiceDetails[invoiceId] = {
    ...detail,
    ...updatedInvoice,
    payments,
    amountPaid,
    amountDue: status === 'paid' ? 0 : amountDue,
  };
  return payment;
}

export function offlineUpdateSettings(values: SettingsFormValues): Settings {
  Object.assign(demoSettings, {
    currency: values.currency.trim(),
    defaultVatRate: Number(values.defaultVatRate),
    quotePrefix: values.quotePrefix.trim(),
    invoicePrefix: values.invoicePrefix.trim(),
    quoteValidityDays: Number(values.quoteValidityDays),
    nextQuoteNumber: Number(values.nextQuoteNumber),
    nextInvoiceNumber: Number(values.nextInvoiceNumber),
    locale: values.locale.trim(),
    paymentTermsDays: Number(values.paymentTermsDays),
    quoteFooter: values.quoteFooter.trim() || null,
    invoiceFooter: values.invoiceFooter.trim() || null,
    quoteTemplateId: values.quoteTemplateId,
    invoiceTemplateId: values.invoiceTemplateId,
    updatedAt: nowIso(),
  });
  return { ...demoSettings };
}

export function offlineUpdateDocumentTemplates(templates: {
  quoteTemplateId: string;
  invoiceTemplateId: string;
}): Settings {
  demoSettings.quoteTemplateId = templates.quoteTemplateId;
  demoSettings.invoiceTemplateId = templates.invoiceTemplateId;
  demoSettings.updatedAt = nowIso();
  return { ...demoSettings };
}

export function offlineUpdateCompanyProfile(
  companyId: string,
  input: UpdateCompanyProfileInput,
): TenantCompany {
  const timestamp = nowIso();
  const index = demoCompanies.findIndex((company) => company.id === companyId);
  const target = index >= 0 ? demoCompanies[index]! : demoCompany;

  Object.assign(target, {
    name: input.companyName.trim(),
    email: input.email.trim(),
    phone: nullable(input.phone),
    address: nullable(input.address),
    postalCode: nullable(input.postalCode),
    city: nullable(input.city),
    country: nullable(input.country),
    siret: nullable(input.siret.replace(/\s/g, '')),
    vatNumber: nullable(input.vatNumber.replace(/\s/g, '').toUpperCase()),
    iban: nullable(input.iban.replace(/\s/g, '').toUpperCase()),
    bic: nullable(input.bic.replace(/\s/g, '').toUpperCase()),
    paymentMethods: input.paymentMethods,
    updatedAt: timestamp,
  });

  if (target.id === demoCompany.id) {
    Object.assign(demoCompany, target);
  }

  Object.assign(demoProfile, {
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    company_name: input.companyName.trim(),
    email: input.email.trim(),
    phone: nullable(input.phone),
    address: nullable(input.address),
    postal_code: nullable(input.postalCode),
    city: nullable(input.city),
    country: nullable(input.country),
    siret: nullable(input.siret.replace(/\s/g, '')),
    vat_number: nullable(input.vatNumber.replace(/\s/g, '').toUpperCase()),
    iban: nullable(input.iban.replace(/\s/g, '').toUpperCase()),
    bic: nullable(input.bic.replace(/\s/g, '').toUpperCase()),
    payment_methods: input.paymentMethods,
    updated_at: timestamp,
  });

  return { ...target };
}

type OfflineDocumentSignature = {
  id: string;
  userId: string;
  documentType: 'quote' | 'invoice';
  documentId: string;
  signatureUrl: string;
  signerName: string | null;
  signedAt: string;
  createdAt: string;
  updatedAt: string;
};

const demoDocumentSignatures = new Map<string, OfflineDocumentSignature>();

function signatureKey(documentType: 'quote' | 'invoice', documentId: string): string {
  return `${documentType}:${documentId}`;
}

export function offlineGetDocumentSignature(
  documentType: 'quote' | 'invoice',
  documentId: string,
): OfflineDocumentSignature | null {
  return demoDocumentSignatures.get(signatureKey(documentType, documentId)) ?? null;
}

export function offlineUpsertDocumentSignature(input: {
  userId: string;
  documentType: 'quote' | 'invoice';
  documentId: string;
  signatureUrl: string;
  signerName?: string | null;
  signedAt?: string;
}): OfflineDocumentSignature {
  const key = signatureKey(input.documentType, input.documentId);
  const existing = demoDocumentSignatures.get(key);
  const timestamp = nowIso();
  const next: OfflineDocumentSignature = {
    id: existing?.id ?? newId('sig'),
    userId: input.userId,
    documentType: input.documentType,
    documentId: input.documentId,
    signatureUrl: input.signatureUrl,
    signerName: input.signerName ?? null,
    signedAt: input.signedAt ?? timestamp,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
  demoDocumentSignatures.set(key, next);
  return next;
}

export function offlineDeleteDocumentSignature(
  documentType: 'quote' | 'invoice',
  documentId: string,
): void {
  demoDocumentSignatures.delete(signatureKey(documentType, documentId));
}

export function offlineCreateCompany(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Le nom de l’entreprise est obligatoire.');
  }

  const timestamp = nowIso();
  const id = newId('company');
  const company: TenantCompany = {
    id,
    name: trimmed,
    email: null,
    phone: null,
    address: null,
    postalCode: null,
    city: null,
    country: 'France',
    siret: null,
    vatNumber: null,
    iban: null,
    bic: null,
    paymentMethods: ['bank_transfer'],
    logoUrl: null,
    signatureUrl: null,
    role: 'owner',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  demoCompanies.unshift(company);
  return id;
}

export function offlineListCompanies(): TenantCompany[] {
  return demoCompanies.map((company) => ({ ...company }));
}

export function offlineDeleteCompany(companyId: string): void {
  if (demoCompanies.length <= 1) {
    throw new Error('Vous devez conserver au moins une entreprise.');
  }

  const index = demoCompanies.findIndex((company) => company.id === companyId);
  if (index < 0) {
    throw new Error('Entreprise introuvable.');
  }

  demoCompanies.splice(index, 1);
}

export function offlineUpdateCompanyAssetUrl(
  companyId: string,
  field: 'logo_url' | 'signature_url',
  url: string | null,
): void {
  const company = demoCompanies.find((entry) => entry.id === companyId) ?? demoCompany;
  if (field === 'logo_url') {
    company.logoUrl = url;
  } else {
    company.signatureUrl = url;
  }
  company.updatedAt = nowIso();
  if (company.id === demoCompany.id) {
    Object.assign(demoCompany, company);
  }
}

export function offlineRenameCompany(companyId: string, name: string): TenantCompany {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Le nom de l’entreprise est obligatoire.');
  }

  const company = demoCompanies.find((entry) => entry.id === companyId) ?? demoCompany;
  company.name = trimmed;
  company.updatedAt = nowIso();
  if (company.id === demoCompany.id) {
    Object.assign(demoCompany, company);
    demoProfile.company_name = trimmed;
    demoProfile.updated_at = company.updatedAt;
  }
  return { ...company };
}
