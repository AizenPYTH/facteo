export const companiesQueryKeys = {
  all: ['companies'] as const,
  list: (userId: string) => [...companiesQueryKeys.all, 'list', userId] as const,
  detail: (companyId: string) => [...companiesQueryKeys.all, 'detail', companyId] as const,
};
