/**
 * AES-GCM token encryption for SUPER PDP OAuth tokens.
 * Key: SUPER_PDP_TOKEN_ENCRYPTION_KEY (32-byte hex or base64).
 * Never log plaintext tokens or the key.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getKeyMaterial(): string {
  const key = Deno.env.get('SUPER_PDP_TOKEN_ENCRYPTION_KEY')?.trim();
  if (!key) {
    throw new Error('SUPER_PDP_TOKEN_ENCRYPTION_KEY is not configured.');
  }
  return key;
}

async function importKey(): Promise<CryptoKey> {
  const raw = getKeyMaterial();
  let bytes: Uint8Array;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    bytes = hexToBytes(raw);
  } else {
    bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  }
  if (bytes.length !== 32) {
    throw new Error('SUPER_PDP_TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex chars or base64).');
  }
  return crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  );
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return bytesToBase64(combined);
}

export async function decryptSecret(payload: string): Promise<string> {
  const key = await importKey();
  const combined = base64ToBytes(payload);
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return decoder.decode(plain);
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
