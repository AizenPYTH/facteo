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

export function parseMobileLoginQrPayload(
  raw: string,
): { challengeId: string; secret: string } | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value.includes('://') ? value : `inveq://mlc?${value.replace(/^\?/, '')}`);
    const challengeId = url.searchParams.get('c') ?? url.searchParams.get('challengeId');
    const secret = url.searchParams.get('s') ?? url.searchParams.get('secret');
    if (challengeId && secret) {
      return { challengeId, secret };
    }
  } catch {
    // Not a URL — try querystring / JSON.
  }

  try {
    const parsed = JSON.parse(value) as { c?: string; s?: string; challengeId?: string; secret?: string };
    const challengeId = parsed.c ?? parsed.challengeId;
    const secret = parsed.s ?? parsed.secret;
    if (challengeId && secret) {
      return { challengeId, secret };
    }
  } catch {
    return null;
  }

  return null;
}

function getFunctionsBaseUrl(): string | null {
  const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/functions/v1` : null;
}

export function getMobileLoginFunctionUrl(): string | null {
  const base = getFunctionsBaseUrl();
  return base ? `${base}/mobile-login` : null;
}

function getMobileLoginAnonKey(): string | null {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    null
  );
}

type CallOptions = {
  accessToken?: string | null;
  body: Record<string, unknown>;
};

async function callMobileLogin<T>(options: CallOptions): Promise<T> {
  const endpoint = getMobileLoginFunctionUrl();
  if (!endpoint) {
    throw new Error('Connexion mobile non configurée.');
  }

  const anonKey = getMobileLoginAnonKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (anonKey) {
    headers.apikey = anonKey;
  }
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  } else if (anonKey) {
    headers.Authorization = `Bearer ${anonKey}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(options.body),
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
  }>({ accessToken, body: { action: 'create' } });
}

export function scanMobileLoginChallenge(challengeId: string, secret: string) {
  return callMobileLogin<MobileLoginPublicStatus>({
    body: { action: 'scan', challengeId, secret },
  });
}

export function getMobileLoginStatus(input: {
  challengeId: string;
  secret?: string;
  accessToken?: string | null;
}) {
  return callMobileLogin<MobileLoginPublicStatus>({
    accessToken: input.accessToken,
    body: { action: 'status', challengeId: input.challengeId, secret: input.secret },
  });
}

export function approveMobileLoginChallenge(accessToken: string, challengeId: string) {
  return callMobileLogin<MobileLoginPublicStatus>({
    accessToken,
    body: { action: 'approve', challengeId },
  });
}

export function denyMobileLoginChallenge(accessToken: string, challengeId: string) {
  return callMobileLogin<MobileLoginPublicStatus>({
    accessToken,
    body: { action: 'deny', challengeId },
  });
}

export function redeemMobileLoginChallenge(challengeId: string, secret: string) {
  return callMobileLogin<{ tokenHash: string; status: 'used' }>({
    body: { action: 'redeem', challengeId, secret },
  });
}
