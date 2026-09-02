import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { corsHeaders, jsonResponse } from '../_shared/http.ts';

const TTL_SECONDS = 90;
const MAX_PENDING_PER_USER = 3;

type Action = 'create' | 'scan' | 'status' | 'approve' | 'deny' | 'redeem';

type ChallengeRow = {
  id: string;
  user_id: string;
  secret_hash: string;
  status: string;
  expires_at: string;
  scanned_at: string | null;
  approved_at: string | null;
  used_at: string | null;
  token_hash: string | null;
};

type Body = {
  action?: Action;
  challengeId?: string;
  secret?: string;
};

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function isExpired(row: ChallengeRow): boolean {
  return new Date(row.expires_at).getTime() <= Date.now();
}

function publicStatus(row: ChallengeRow) {
  const expired = isExpired(row) && row.status !== 'used';
  return {
    challengeId: row.id,
    status: expired ? 'expired' : row.status,
    expiresAt: row.expires_at,
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Méthode non autorisée.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonResponse({ error: 'Configuration serveur incomplète.' }, 500);
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const action = body.action;
  const challengeId = body.challengeId?.trim();
  const secret = body.secret?.trim();

  if (!action) {
    return jsonResponse({ error: 'Action manquante.' }, 400);
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  async function requireUser() {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return { error: jsonResponse({ error: 'Non autorisé.' }, 401) };
    }

    const userClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error,
    } = await userClient.auth.getUser();

    if (error || !user) {
      return { error: jsonResponse({ error: 'Non autorisé.' }, 401) };
    }

    return { user };
  }

  async function loadChallenge(id: string): Promise<ChallengeRow | null> {
    const { data, error } = await serviceClient
      .from('mobile_login_challenges')
      .select(
        'id, user_id, secret_hash, status, expires_at, scanned_at, approved_at, used_at, token_hash',
      )
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as ChallengeRow;
  }

  async function requireSecretMatch(row: ChallengeRow): Promise<Response | null> {
    if (!secret) {
      return jsonResponse({ error: 'Code invalide.' }, 400);
    }

    const hash = await sha256Hex(secret);
    if (!timingSafeEqual(hash, row.secret_hash)) {
      return jsonResponse({ error: 'Code invalide ou expiré.' }, 401);
    }

    return null;
  }

  try {
    if (action === 'create') {
      const auth = await requireUser();
      if ('error' in auth && auth.error) {
        return auth.error;
      }
      const user = auth.user!;
      if (!user.email) {
        return jsonResponse({ error: 'Compte sans adresse e-mail.' }, 400);
      }

      await serviceClient
        .from('mobile_login_challenges')
        .update({ status: 'expired' })
        .eq('user_id', user.id)
        .in('status', ['pending', 'scanned'])
        .lt('expires_at', new Date().toISOString());

      const { count } = await serviceClient
        .from('mobile_login_challenges')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pending', 'scanned']);

      if ((count ?? 0) >= MAX_PENDING_PER_USER) {
        return jsonResponse(
          { error: 'Trop de codes en cours. Attendez l’expiration ou refusez-les.' },
          429,
        );
      }

      const nextSecret = randomSecret();
      const secretHash = await sha256Hex(nextSecret);
      const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000).toISOString();

      const { data, error } = await serviceClient
        .from('mobile_login_challenges')
        .insert({
          user_id: user.id,
          secret_hash: secretHash,
          status: 'pending',
          expires_at: expiresAt,
        })
        .select('id, expires_at')
        .single();

      if (error || !data) {
        return jsonResponse({ error: 'Impossible de créer le code.' }, 500);
      }

      return jsonResponse({
        challengeId: data.id,
        secret: nextSecret,
        expiresAt: data.expires_at,
        ttlSeconds: TTL_SECONDS,
      });
    }

    if (!challengeId) {
      return jsonResponse({ error: 'Identifiant manquant.' }, 400);
    }

    const row = await loadChallenge(challengeId);
    if (!row) {
      return jsonResponse({ error: 'Code invalide ou expiré.' }, 404);
    }

    if (action === 'status') {
      const authHeader = request.headers.get('Authorization');
      if (authHeader) {
        const auth = await requireUser();
        if ('error' in auth && auth.error) {
          return auth.error;
        }
        if (auth.user!.id !== row.user_id) {
          return jsonResponse({ error: 'Code introuvable.' }, 404);
        }
        return jsonResponse(publicStatus(row));
      }

      const mismatch = await requireSecretMatch(row);
      if (mismatch) {
        return mismatch;
      }
      return jsonResponse(publicStatus(row));
    }

    if (action === 'scan') {
      const mismatch = await requireSecretMatch(row);
      if (mismatch) {
        return mismatch;
      }
      if (isExpired(row) || row.status === 'used' || row.status === 'denied' || row.status === 'expired') {
        return jsonResponse({ error: 'Code invalide ou expiré.' }, 410);
      }
      if (row.status === 'approved') {
        return jsonResponse(publicStatus(row));
      }

      const { error } = await serviceClient
        .from('mobile_login_challenges')
        .update({ status: 'scanned', scanned_at: new Date().toISOString() })
        .eq('id', row.id)
        .in('status', ['pending', 'scanned']);

      if (error) {
        return jsonResponse({ error: 'Impossible de valider le scan.' }, 500);
      }

      return jsonResponse({ ...publicStatus(row), status: 'scanned' });
    }

    if (action === 'approve' || action === 'deny') {
      const auth = await requireUser();
      if ('error' in auth && auth.error) {
        return auth.error;
      }
      if (auth.user!.id !== row.user_id) {
        return jsonResponse({ error: 'Code introuvable.' }, 404);
      }
      if (isExpired(row) || row.status === 'used' || row.status === 'expired') {
        return jsonResponse({ error: 'Code expiré.' }, 410);
      }
      if (row.status === 'denied') {
        return jsonResponse(publicStatus({ ...row, status: 'denied' }));
      }

      if (action === 'deny') {
        await serviceClient
          .from('mobile_login_challenges')
          .update({ status: 'denied' })
          .eq('id', row.id);
        return jsonResponse({ ...publicStatus(row), status: 'denied' });
      }

      if (!auth.user!.email) {
        return jsonResponse({ error: 'Compte sans adresse e-mail.' }, 400);
      }

      // Admin generateLink returns hashed_token without sending an email
      // (unlike signInWithOtp). The token is stored hashed in the challenge
      // and redeemed once via verifyOtp on the phone after PC approval.
      const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
        type: 'magiclink',
        email: auth.user!.email,
      });

      const hashedToken = linkData?.properties?.hashed_token;
      if (linkError || !hashedToken) {
        return jsonResponse({ error: 'Impossible de préparer la session mobile.' }, 500);
      }

      const { error } = await serviceClient
        .from('mobile_login_challenges')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          token_hash: hashedToken,
        })
        .eq('id', row.id)
        .in('status', ['pending', 'scanned']);

      if (error) {
        return jsonResponse({ error: 'Impossible d’approuver la connexion.' }, 500);
      }

      return jsonResponse({ ...publicStatus(row), status: 'approved' });
    }

    if (action === 'redeem') {
      const mismatch = await requireSecretMatch(row);
      if (mismatch) {
        return mismatch;
      }
      if (isExpired(row) || row.status !== 'approved' || row.used_at || !row.token_hash) {
        return jsonResponse({ error: 'Code non approuvé, déjà utilisé ou expiré.' }, 409);
      }

      const { data, error } = await serviceClient
        .from('mobile_login_challenges')
        .update({ status: 'used', used_at: new Date().toISOString(), token_hash: null })
        .eq('id', row.id)
        .eq('status', 'approved')
        .is('used_at', null)
        .select('id')
        .maybeSingle();

      if (error || !data) {
        return jsonResponse({ error: 'Code déjà utilisé.' }, 409);
      }

      return jsonResponse({ tokenHash: row.token_hash, status: 'used' });
    }

    return jsonResponse({ error: 'Action inconnue.' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inattendue.';
    return jsonResponse({ error: message }, 500);
  }
});
