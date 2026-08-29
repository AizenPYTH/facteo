/// <reference types="npm:@types/node" />

import { X509Certificate } from 'node:crypto';
import * as jose from 'https://esm.sh/jose@5.9.6';

import { allowedAppleProductIds } from './apple-products.ts';

export type AppleVerifiedTransaction = {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  bundleId: string;
  environment: string;
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
    throw new Error(`Secret Apple manquant : ${name}`);
  }

  return value;
}

function normalizePrivateKey(raw: string): string {
  return raw.trim().replace(/\\n/g, '\n');
}

export function getAppleBundleId(): string {
  return Deno.env.get('APPLE_BUNDLE_ID')?.trim() || 'com.inveq.app';
}

export function getAllowedAppleProductIds(): Set<string> {
  return allowedAppleProductIds();
}

export async function createAppStoreServerApiToken(): Promise<string> {
  const issuerId = readRequiredEnv('APPLE_IAP_ISSUER_ID');
  const keyId = readRequiredEnv('APPLE_IAP_KEY_ID');
  const privateKey = normalizePrivateKey(readRequiredEnv('APPLE_IAP_PRIVATE_KEY'));
  const key = await jose.importPKCS8(privateKey, 'ES256');

  return await new jose.SignJWT({ bid: getAppleBundleId() })
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

function assertCertificateIsCurrent(
  certificate: X509Certificate,
  label: string,
): void {
  const now = Date.now();
  const validFrom = Date.parse(certificate.validFrom);
  const validTo = Date.parse(certificate.validTo);

  if (!Number.isFinite(validFrom) || !Number.isFinite(validTo)) {
    throw new Error(`Dates du certificat Apple ${label} invalides.`);
  }

  if (now < validFrom || now > validTo) {
    throw new Error(`Certificat Apple ${label} expiré ou pas encore valide.`);
  }
}

function verifyAppleCertificateChain(x5c: string[]): void {
  if (x5c.length !== 3) {
    throw new Error('Chaîne de certificats Apple incomplète.');
  }

  const [leafDer, intermediateDer, rootDer] = x5c;
  const pinnedRootDer = derBase64FromPem(APPLE_ROOT_CA_G3_PEM);

  if (rootDer !== pinnedRootDer) {
    throw new Error('Certificat racine Apple invalide.');
  }

  const leaf = new X509Certificate(pemFromX5c(leafDer));
  const intermediate = new X509Certificate(pemFromX5c(intermediateDer));
  const root = new X509Certificate(APPLE_ROOT_CA_G3_PEM);

  assertCertificateIsCurrent(leaf, 'feuille');
  assertCertificateIsCurrent(intermediate, 'intermédiaire');
  assertCertificateIsCurrent(root, 'racine');

  if (!intermediate.ca || !root.ca) {
    throw new Error('Autorité de certification Apple invalide.');
  }

  if (!leaf.checkIssued(intermediate) || !leaf.verify(intermediate.publicKey)) {
    throw new Error('Signature du certificat Apple feuille invalide.');
  }

  if (!intermediate.checkIssued(root) || !intermediate.verify(root.publicKey)) {
    throw new Error('Signature du certificat Apple intermédiaire invalide.');
  }
}

/**
 * Vérifie la chaîne x5c StoreKit, puis la signature ES256 du JWS.
 */
export async function verifyAndDecodeAppleJws(
  jws: string,
): Promise<Record<string, unknown>> {
  const header = jose.decodeProtectedHeader(jws);
  const x5c = header.x5c;

  if (!x5c || x5c.length === 0) {
    throw new Error('JWS Apple sans certificat x5c.');
  }

  verifyAppleCertificateChain(x5c);

  const leafKey = await jose.importX509(pemFromX5c(x5c[0]), 'ES256');
  const { payload } = await jose.jwtVerify(jws, leafKey, {
    algorithms: ['ES256'],
  });

  return payload as Record<string, unknown>;
}

function toVerifiedTransaction(
  payload: Record<string, unknown>,
): AppleVerifiedTransaction {
  const transactionId = String(payload.transactionId ?? '');
  const originalTransactionId = String(
    payload.originalTransactionId ?? transactionId,
  );
  const productId = String(payload.productId ?? '');
  const bundleId = String(payload.bundleId ?? '');

  if (!transactionId || !originalTransactionId || !productId || !bundleId) {
    throw new Error('Payload transaction Apple incomplet.');
  }

  return {
    transactionId,
    originalTransactionId,
    productId,
    bundleId,
    environment: String(payload.environment ?? 'Production'),
    purchaseDate:
      typeof payload.purchaseDate === 'number' ? payload.purchaseDate : null,
    expiresDate:
      typeof payload.expiresDate === 'number' ? payload.expiresDate : null,
    revocationDate:
      typeof payload.revocationDate === 'number' ? payload.revocationDate : null,
    type: typeof payload.type === 'string' ? payload.type : null,
  };
}

function assertExpectedApp(transaction: AppleVerifiedTransaction): void {
  if (transaction.bundleId !== getAppleBundleId()) {
    throw new Error(`Bundle ID Apple invalide (${transaction.bundleId}).`);
  }

  if (!getAllowedAppleProductIds().has(transaction.productId)) {
    throw new Error(`Produit Apple non autorisé (${transaction.productId}).`);
  }
}

export async function decodeAppleTransactionJws(
  jws: string,
): Promise<AppleVerifiedTransaction> {
  const transaction = toVerifiedTransaction(await verifyAndDecodeAppleJws(jws));
  assertExpectedApp(transaction);
  return transaction;
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
  const response = await fetch(
    `${host}/inApps/v1/transactions/${encodeURIComponent(transactionId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `App Store Server API ${environment} ${response.status}: ${body}`,
    );
  }

  const json = (await response.json()) as { signedTransactionInfo?: string };

  if (!json.signedTransactionInfo) {
    throw new Error('Réponse Apple sans signedTransactionInfo.');
  }

  return json.signedTransactionInfo;
}

/**
 * Interroge l'App Store Server API et contrôle aussi le JWS reçu du device.
 */
export async function verifyAppleSubscriptionTransaction(input: {
  transactionId: string;
  purchaseToken?: string | null;
}): Promise<AppleVerifiedTransaction> {
  let signedTransaction: string | null = null;
  let productionError: Error | null = null;

  try {
    signedTransaction = await fetchTransactionInfoFromApple(
      input.transactionId,
      'production',
    );
  } catch (error) {
    productionError =
      error instanceof Error ? error : new Error(String(error));

    try {
      signedTransaction = await fetchTransactionInfoFromApple(
        input.transactionId,
        'sandbox',
      );
    } catch (sandboxError) {
      const sandboxMessage =
        sandboxError instanceof Error
          ? sandboxError.message
          : String(sandboxError);
      throw new Error(
        `Vérification Apple impossible. Production: ${productionError.message} | Sandbox: ${sandboxMessage}`,
      );
    }
  }

  if (!signedTransaction) {
    throw new Error('Réponse Apple sans transaction signée.');
  }

  const verified = await decodeAppleTransactionJws(signedTransaction);

  if (input.purchaseToken?.trim()) {
    const deviceTransaction = await decodeAppleTransactionJws(
      input.purchaseToken.trim(),
    );
    const matchesTransaction =
      deviceTransaction.transactionId === verified.transactionId ||
      deviceTransaction.originalTransactionId ===
        verified.originalTransactionId;

    if (
      !matchesTransaction ||
      deviceTransaction.productId !== verified.productId
    ) {
      throw new Error('JWS device incohérent avec la transaction Apple.');
    }
  }

  if (verified.revocationDate) {
    throw new Error('Transaction Apple révoquée ou remboursée.');
  }

  if (verified.expiresDate && verified.expiresDate < Date.now()) {
    throw new Error('Abonnement Apple expiré.');
  }

  return verified;
}

export function appleSubscriptionStorageId(
  originalTransactionId: string,
): string {
  return `apple:${originalTransactionId}`;
}

export function toIsoFromAppleMs(ms: number | null): string | null {
  return ms ? new Date(ms).toISOString() : null;
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
