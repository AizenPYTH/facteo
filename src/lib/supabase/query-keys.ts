export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  byCompany: (companyId: string) => [...dashboardQueryKeys.all, companyId] as const,
};

export const clientsQueryKeys = {
  all: ['clients'] as const,
  lists: () => [...clientsQueryKeys.all, 'list'] as const,
  list: (companyId: string, search: string) =>
    [...clientsQueryKeys.lists(), companyId, search] as const,
  infiniteList: (companyId: string, search: string) =>
    [...clientsQueryKeys.lists(), 'infinite', companyId, search] as const,
  details: () => [...clientsQueryKeys.all, 'detail'] as const,
  detail: (companyId: string, clientId: string) =>
    [...clientsQueryKeys.details(), companyId, clientId] as const,
  documents: (companyId: string, clientId: string) =>
    [...clientsQueryKeys.detail(companyId, clientId), 'documents'] as const,
  memory: (companyId: string, clientId: string) =>
    [...clientsQueryKeys.detail(companyId, clientId), 'memory'] as const,
};

export const profilesQueryKeys = {
  all: ['profiles'] as const,
  company: (companyId: string) => [...profilesQueryKeys.all, 'company', companyId] as const,
  assets: (companyId: string) => [...profilesQueryKeys.all, 'assets', companyId] as const,
};

export const companySearchQueryKeys = {
  all: ['company-search'] as const,
  lookup: (registrationNumber: string) =>
    [...companySearchQueryKeys.all, registrationNumber] as const,
};

export const quotesQueryKeys = {
  all: ['quotes'] as const,
  lists: () => [...quotesQueryKeys.all, 'list'] as const,
  infiniteList: (companyId: string, search: string, status: string) =>
    [...quotesQueryKeys.lists(), 'infinite', companyId, search, status] as const,
  details: () => [...quotesQueryKeys.all, 'detail'] as const,
  detail: (companyId: string, quoteId: string) =>
    [...quotesQueryKeys.details(), companyId, quoteId] as const,
};

export const invoicesQueryKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoicesQueryKeys.all, 'list'] as const,
  infiniteList: (companyId: string, search: string, status: string, due = 'all') =>
    [...invoicesQueryKeys.lists(), 'infinite', companyId, search, status, due] as const,
  details: () => [...invoicesQueryKeys.all, 'detail'] as const,
  detail: (companyId: string, invoiceId: string) =>
    [...invoicesQueryKeys.details(), companyId, invoiceId] as const,
};

export const settingsQueryKeys = {
  all: ['settings'] as const,
  byCompany: (companyId: string) => [...settingsQueryKeys.all, companyId] as const,
};

export const sentDocumentsQueryKeys = {
  all: ['sent-documents'] as const,
  forDocument: (userId: string, documentType: string, documentId: string) =>
    [...sentDocumentsQueryKeys.all, userId, documentType, documentId] as const,
};

export const notificationsQueryKeys = {
  all: ['notifications'] as const,
  preferences: (userId: string) => [...notificationsQueryKeys.all, 'preferences', userId] as const,
};

export const subscriptionQueryKeys = {
  all: ['subscription'] as const,
  snapshot: (userId: string) => [...subscriptionQueryKeys.all, 'snapshot', userId] as const,
  plans: () => [...subscriptionQueryKeys.all, 'plans'] as const,
  documentSignature: (documentType: string, documentId: string) =>
    [...subscriptionQueryKeys.all, 'signature', documentType, documentId] as const,
};

export { companiesQueryKeys } from '@/lib/supabase/query-keys-companies';
