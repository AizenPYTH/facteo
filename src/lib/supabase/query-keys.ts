export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  byUser: (userId: string) => [...dashboardQueryKeys.all, userId] as const,
};

export const clientsQueryKeys = {
  all: ['clients'] as const,
  lists: () => [...clientsQueryKeys.all, 'list'] as const,
  list: (userId: string, search: string) =>
    [...clientsQueryKeys.lists(), userId, search] as const,
  infiniteList: (userId: string, search: string) =>
    [...clientsQueryKeys.lists(), 'infinite', userId, search] as const,
  details: () => [...clientsQueryKeys.all, 'detail'] as const,
  detail: (userId: string, clientId: string) =>
    [...clientsQueryKeys.details(), userId, clientId] as const,
};

export const profilesQueryKeys = {
  all: ['profiles'] as const,
  company: (userId: string) => [...profilesQueryKeys.all, 'company', userId] as const,
};

export const productsQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productsQueryKeys.all, 'list'] as const,
  infiniteList: (userId: string, search: string) =>
    [...productsQueryKeys.lists(), 'infinite', userId, search] as const,
};

export const quotesQueryKeys = {
  all: ['quotes'] as const,
  lists: () => [...quotesQueryKeys.all, 'list'] as const,
  infiniteList: (userId: string, search: string) =>
    [...quotesQueryKeys.lists(), 'infinite', userId, search] as const,
};
