export const MOBILE_LOGIN_TTL_SECONDS = 90;

export type MobileLoginStatus =
  | 'pending'
  | 'scanned'
  | 'approved'
  | 'denied'
  | 'expired'
  | 'used';

export type MobileLoginPublicStatus = {
  challengeId: string;
  status: MobileLoginStatus;
  expiresAt: string;
};

export function buildMobileLoginQrPayload(challengeId: string, secret: string): string {
  const params = new URLSearchParams({ c: challengeId, s: secret });
  return `inveq://mlc?${params.toString()}`;
}

async function callMobileLogin<T>(
  accessToken: string | null,
  body: Record<string, unknown>,
): Promise<T> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl) {
    throw new Error('Supabase non configuré.');
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (anonKey) {
    headers.apikey = anonKey;
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else if (anonKey) {
    headers.Authorization = `Bearer ${anonKey}`;
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/mobile-login`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as (T & { error?: string }) | { error?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? 'Connexion mobile impossible.');
  }

  return payload as T;
}

export function createMobileLoginChallenge(accessToken: string) {
  return callMobileLogin<{
    challengeId: string;
    secret: string;
    expiresAt: string;
    ttlSeconds: number;
  }>(accessToken, { action: 'create' });
}

export function getMobileLoginStatus(accessToken: string, challengeId: string) {
  return callMobileLogin<MobileLoginPublicStatus>(accessToken, {
    action: 'status',
    challengeId,
  });
}

export function approveMobileLoginChallenge(accessToken: string, challengeId: string) {
  return callMobileLogin<MobileLoginPublicStatus>(accessToken, {
    action: 'approve',
    challengeId,
  });
}

export function denyMobileLoginChallenge(accessToken: string, challengeId: string) {
  return callMobileLogin<MobileLoginPublicStatus>(accessToken, {
    action: 'deny',
    challengeId,
  });
}
