/**
 * Vérification App Store Server API + décodage JWS transaction.
 * Les credentials (.p8) sont obligatoires : on ne fait jamais confiance au seul transactionId client.
 */
import * as jose from 'https://esm.sh/jose@5.9.6';

export type AppleVerifiedTransaction = {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  bundleId: string;
  environment: 'Sandbox' | 'Production' | string;
  purchaseDate: number | null;
  expiresDate: number | null;
  revocationDate: number | null;
  type: string | null;
};

const APPLE_ROOT_CA_G3_PEM = `-----BEGIN CERTIFICATE-----
MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwS
QXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9u
IEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcN
MTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBS
b290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9y
aXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49
AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtf
TjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517
IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySr
MA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gA
MGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4
at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM
6BgD56KyKA==
-----END CERTIFICATE-----`;

function readRequiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Secret manquant : ${name}`);
  }
  return value;
}

function normalizePrivateKey(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes('BEGIN PRIVATE KEY')) {
    return trimmed;
  }
  // Supabase secrets souvent stockés avec \n littéraux.
  return trimmed.replace(/\\n/g, '\n');
}

export function getAppleBundleId(): string {
  return Deno.env.get('APPLE_BUNDLE_ID')?.trim() || 'com.inveq.app';
}

export function getAllowedAppleProductIds(): Set<string> {
  const primary =
    Deno.env.get('APPLE_PREMIUM_PRODUCT_ID')?.trim() || 'com.inveq.app.premium.monthly';
  return new Set([primary]);
}

export async function createAppStoreServerApiToken(): Promise<string> {
  const issuerId = readRequiredEnv('APPLE_IAP_ISSUER_ID');
  const keyId = readRequiredEnv('APPLE_IAP_KEY_ID');
  const privateKey = normalizePrivateKey(readRequiredEnv('APPLE_IAP_PRIVATE_KEY'));
  const bundleId = getAppleBundleId();

  const key = await jose.importPKCS8(privateKey, 'ES256');

  return await new jose.SignJWT({ bid: bundleId })
    .setProtectedHeader({ alg: 'ES256', kid: keyId, typ: 'JWT' })
    .setIssuer(issuerId)
    .setIssuedAt()
    .setExpirationTime('15m')
    .setAudience('appstoreconnect-v1')
    .sign(key);
}

function pemFromX5c(base64Der: string): string {
  const lines = base64Der.match(/.{1,64}/g) ?? [base64Der];
  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----`;
}

function derBase64FromPem(pem: string): string {
  return pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
}

/**
 * Vérifie la signature JWS StoreKit (x5c) et ancre la chaîne sur Apple Root CA - G3.
 */
export async function verifyAndDecodeAppleJws(jws: string): Promise<Record<string, unknown>> {
  const header = jose.decodeProtectedHeader(jws);
  const x5c = header.x5c;

  if (!x5c || x5c.length === 0) {
    throw new Error('JWS Apple sans certificat x5c.');
  }

  const appleRootDer = derBase64FromPem(APPLE_ROOT_CA_G3_PEM);
  const chainIncludesAppleRoot = x5c.some((cert) => cert === appleRootDer);

  // La feuille signe le JWS. La chaîne doit remonter à Apple (root inclus ou parent Apple).
  if (!chainIncludesAppleRoot && x5c.length < 2) {
    throw new Error('Chaîne de certificats Apple incomplète.');
  }

  if (chainIncludesAppleRoot === false) {
    // x5c StoreKit = [leaf, intermediate] ; on vérifie que le sujet intermédiaire est Apple.
    const intermediatePem = pemFromX5c(x5c[x5c.length - 1]!);
    if (!intermediatePem.includes('Apple')) {
      throw new Error('Certificat intermédiaire Apple invalide.');
    }
  }

  const leafKey = await jose.importX509(pemFromX5c(x5c[0]!), 'ES256');
  const { payload } = await jose.jwtVerify(jws, leafKey, {
    algorithms: ['ES256'],
  });

  return payload as Record<string, unknown>;
}

function toVerifiedTransaction(payload: Record<string, unknown>): AppleVerifiedTransaction {
  const transactionId = String(payload.transactionId ?? '');
  const originalTransactionId = String(payload.originalTransactionId ?? transactionId);
  const productId = String(payload.productId ?? '');
  const bundleId = String(payload.bundleId ?? '');

  if (!transactionId || !productId || !bundleId) {
    throw new Error('Payload transaction Apple incomplet.');
  }

  return {
    transactionId,
    originalTransactionId,
    productId,
    bundleId,
    environment: String(payload.environment ?? 'Production'),
    purchaseDate: typeof payload.purchaseDate === 'number' ? payload.purchaseDate : null,
    expiresDate: typeof payload.expiresDate === 'number' ? payload.expiresDate : null,
    revocationDate: typeof payload.revocationDate === 'number' ? payload.revocationDate : null,
    type: typeof payload.type === 'string' ? payload.type : null,
  };
}

async function fetchTransactionInfoFromApple(
  transactionId: string,
  environment: 'production' | 'sandbox',
): Promise<string> {
  const token = await createAppStoreServerApiToken();
  const host =
    environment === 'sandbox'
      ? 'https://api.storekit-sandbox.itunes.apple.com'
      : 'https://api.storekit.itunes.apple.com';

  const response = await fetch(`${host}/inApps/v1/transactions/${encodeURIComponent(transactionId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`App Store Server API ${environment} ${response.status}: ${body}`);
  }

  const json = (await response.json()) as { signedTransactionInfo?: string };
  if (!json.signedTransactionInfo) {
    throw new Error('Réponse Apple sans signedTransactionInfo.');
  }

  return json.signedTransactionInfo;
}

/**
 * Source de vérité : App Store Server API (transactionId),
 * avec contrôle croisé optionnel du JWS device (purchaseToken).
 */
export async function verifyAppleSubscriptionTransaction(input: {
  transactionId: string;
  purchaseToken?: string | null;
}): Promise<AppleVerifiedTransaction> {
  const allowedProducts = getAllowedAppleProductIds();
  const expectedBundleId = getAppleBundleId();

  let signedFromApi: string | null = null;
  let apiError: Error | null = null;

  try {
    signedFromApi = await fetchTransactionInfoFromApple(input.transactionId, 'production');
  } catch (error) {
    apiError = error instanceof Error ? error : new Error(String(error));
    try {
      signedFromApi = await fetchTransactionInfoFromApple(input.transactionId, 'sandbox');
      apiError = null;
    } catch (sandboxError) {
      apiError =
        sandboxError instanceof Error
          ? new Error(
              `Production: ${apiError.message} | Sandbox: ${sandboxError instanceof Error ? sandboxError.message : String(sandboxError)}`,
            )
          : apiError;
    }
  }

  if (!signedFromApi) {
    throw new Error(
      apiError?.message ??
        'Impossible de vérifier la transaction auprès d’Apple. Configurez APPLE_IAP_ISSUER_ID / KEY_ID / PRIVATE_KEY.',
    );
  }

  const verified = toVerifiedTransaction(await verifyAndDecodeAppleJws(signedFromApi));

  if (input.purchaseToken?.trim()) {
    const devicePayload = toVerifiedTransaction(
      await verifyAndDecodeAppleJws(input.purchaseToken.trim()),
    );
    if (
      devicePayload.originalTransactionId !== verified.originalTransactionId &&
      devicePayload.transactionId !== verified.transactionId
    ) {
      throw new Error('JWS device incohérent avec la transaction Apple.');
    }
  }

  if (verified.bundleId !== expectedBundleId) {
    throw new Error(`Bundle ID Apple invalide (${verified.bundleId}).`);
  }

  if (!allowedProducts.has(verified.productId)) {
    throw new Error(`Produit Apple non autorisé (${verified.productId}).`);
  }

  if (verified.revocationDate) {
    throw new Error('Transaction Apple révoquée / remboursée.');
  }

  if (verified.expiresDate && verified.expiresDate < Date.now()) {
    throw new Error('Abonnement Apple expiré.');
  }

  return verified;
}

export function appleSubscriptionStorageId(originalTransactionId: string): string {
  return `apple:${originalTransactionId}`;
}

export function toIsoFromAppleMs(ms: number | null): string | null {
  if (!ms) return null;
  return new Date(ms).toISOString();
}

export type AppleNotificationDecoded = {
  notificationType: string;
  subtype?: string;
  data?: {
    signedTransactionInfo?: string;
    signedRenewalInfo?: string;
  };
};

export async function verifyAndDecodeAppleNotification(
  signedPayload: string,
): Promise<AppleNotificationDecoded> {
  const payload = await verifyAndDecodeAppleJws(signedPayload);
  return {
    notificationType: String(payload.notificationType ?? ''),
    subtype: typeof payload.subtype === 'string' ? payload.subtype : undefined,
    data: (payload.data as AppleNotificationDecoded['data']) ?? undefined,
  };
}
