/**
 * Vérification d'identité et d'appartenance pour les Edge Functions
 * d'intégration. Volontairement séparé de `_shared/superpdp/auth.ts` :
 * la facturation électronique existante n'est pas touchée.
 */

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export type AuthedClients = {
  userClient: SupabaseClient;
  serviceClient: SupabaseClient;
  userId: string;
};

export class AuthError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    throw new AuthError('Supabase configuration missing.', 500);
  }
  return createClient(supabaseUrl, serviceKey);
}

/** Exige un JWT utilisateur valide. Utilisé par toutes les fonctions sauf le callback. */
export async function createAuthedClients(request: Request): Promise<AuthedClients> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) {
    throw new AuthError('Supabase configuration missing.', 500);
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    throw new AuthError('Unauthorized.', 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();
  if (error || !user) {
    throw new AuthError('Unauthorized.', 401);
  }

  return { userClient, serviceClient: createServiceClient(), userId: user.id };
}

/** L'utilisateur est-il membre de cette entreprise ? Sinon 403. */
export async function assertCompanyAccess(
  serviceClient: SupabaseClient,
  userId: string,
  companyId: string,
): Promise<void> {
  const { data, error } = await serviceClient
    .from('company_members')
    .select('id')
    .eq('company_id', companyId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) {
    throw new AuthError('Forbidden company access.', 403);
  }
}

export function resolveCompanyId(request: Request, bodyCompanyId?: unknown): string | null {
  const header = request.headers.get('x-inveq-company-id')?.trim();
  if (header) return header;
  return typeof bodyCompanyId === 'string' && bodyCompanyId.trim() ? bodyCompanyId.trim() : null;
}

export function statusForError(error: unknown): number {
  if (error instanceof AuthError) return error.status;
  return 400;
}
