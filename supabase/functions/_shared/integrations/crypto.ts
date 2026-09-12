/**
 * Chiffrement AES-GCM des jetons d'intégration.
 *
 * La clé est lue dans les secrets Supabase, jamais dans le code, jamais côté
 * application. Les valeurs déchiffrées ne doivent jamais être journalisées.
 *
 * Format de sortie : base64(iv[12] || ciphertext||tag).
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const INTEGRATION_KEY_ENV = 'INTEGRATIONS_TOKEN_ENCRYPTION_KEY';

function readKeyMaterial(envName: string): string {
  const key = Deno.env.get(envName)?.trim();
  if (!key) {
    throw new Error(`${envName} is not configured.`);
  }
  return key;
}

/** Accepte 64 caractères hexadécimaux ou une base64 de 32 octets. */
export function decodeKeyMaterial(raw: string): Uint8Array {
  const bytes = /^[0-9a-fA-F]{64}$/.test(raw)
    ? hexToBytes(raw)
    : Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  if (bytes.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (64 hex chars or base64).');
  }
  return bytes;
}

async function importKey(envName: string): Promise<CryptoKey> {
  const bytes = decodeKeyMaterial(readKeyMaterial(envName));
  return crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptSecret(
  plaintext: string,
  envName: string = INTEGRATION_KEY_ENV,
): Promise<string> {
  const key = await importKey(envName);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plaintext));
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return bytesToBase64(combined);
}

export async function decryptSecret(
  payload: string,
  envName: string = INTEGRATION_KEY_ENV,
): Promise<string> {
  const key = await importKey(envName);
  const combined = base64ToBytes(payload);
  if (combined.length <= 12) {
    throw new Error('Ciphertext is too short.');
  }
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return decoder.decode(plain);
}

/** State OAuth : 32 octets d'aléa cryptographique, encodés en hexadécimal. */
export function randomState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
