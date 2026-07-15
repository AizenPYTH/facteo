export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL est manquant. Créez website/.env.local à partir de .env.example.',
    );
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY est manquant. Créez website/.env.local à partir de .env.example.',
    );
  }
  return key;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}
