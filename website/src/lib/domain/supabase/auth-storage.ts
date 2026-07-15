type AuthStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const ssrNoopStorage: AuthStorage = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
};

function createWebAuthStorage(): AuthStorage {
  if (typeof window === 'undefined') {
    return ssrNoopStorage;
  }

  return {
    getItem: async (key) => window.localStorage.getItem(key),
    setItem: async (key, value) => {
      window.localStorage.setItem(key, value);
    },
    removeItem: async (key) => {
      window.localStorage.removeItem(key);
    },
  };
}

/** Stockage auth Supabase — implémentation web uniquement (Next.js). */
export function createSupabaseAuthStorage(): AuthStorage {
  return createWebAuthStorage();
}
