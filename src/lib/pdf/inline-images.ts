import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import type { PdfCompanyInfo } from '@/lib/pdf/engine';

/**
 * Les images du document (logo, signatures) doivent être **embarquées** dans le HTML.
 *
 * La WebView d'`expo-print` n'a aucune garantie de terminer un chargement réseau
 * avant la capture de la page : une `<img src="https://…">` se retrouve rendue
 * comme une image cassée (le fameux « ? »). On télécharge donc l'image d'abord,
 * puis on l'injecte en data-URI.
 *
 * Deux règles importantes :
 * - en cas d'échec on renvoie `null` (surtout PAS l'URL distante, qui produirait
 *   exactement le placeholder cassé qu'on cherche à supprimer) ;
 * - le résultat est mémorisé, car une même facture est rendue plusieurs fois
 *   (aperçu, galerie de modèles, PDF final).
 */

const dataUriCache = new Map<string, string | null>();

const EXTENSION_MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  heic: 'image/heic',
  heif: 'image/heif',
};

function guessMimeTypeFromUrl(url: string): string {
  const withoutQuery = url.split(/[?#]/)[0];
  const extension = withoutQuery.split('.').pop()?.toLowerCase() ?? '';

  return EXTENSION_MIME_TYPES[extension] ?? 'image/png';
}

function normalizeMimeType(value: string | undefined, url: string): string {
  const mimeType = value?.split(';')[0]?.trim().toLowerCase();

  if (mimeType && mimeType.startsWith('image/')) {
    return mimeType;
  }

  return guessMimeTypeFromUrl(url);
}

function readHeader(headers: Record<string, string> | undefined, name: string): string | undefined {
  if (!headers) {
    return undefined;
  }

  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name);
  return key ? headers[key] : undefined;
}

function buildLocalCacheUri(url: string): string {
  const directory = FileSystem.cacheDirectory ?? '';
  const fingerprint = Math.abs(hashString(url)).toString(36);
  const extension = guessMimeTypeFromUrl(url).split('/')[1]?.replace('svg+xml', 'svg') ?? 'png';

  return `${directory}inveq-pdf-asset-${fingerprint}.${extension}`;
}

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return hash;
}

async function fetchAsDataUriWeb(url: string): Promise<string | null> {
  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  const blob = await response.blob();

  return new Promise<string | null>((resolve) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result;

      if (typeof result !== 'string' || !result.startsWith('data:image/')) {
        resolve(null);
        return;
      }

      resolve(result);
    };

    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

async function fetchAsDataUriNative(url: string): Promise<string | null> {
  const destination = buildLocalCacheUri(url);

  await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => undefined);

  const downloaded = await FileSystem.downloadAsync(url, destination);

  if (downloaded.status !== 200) {
    await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => undefined);
    return null;
  }

  const base64 = await FileSystem.readAsStringAsync(downloaded.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => undefined);

  if (!base64) {
    return null;
  }

  const mimeType = normalizeMimeType(readHeader(downloaded.headers, 'content-type'), url);

  return `data:${mimeType};base64,${base64}`;
}

/** Renvoie un data-URI embarquable, ou `null` si l'image n'a pas pu être récupérée. */
export async function resolveInlineImage(url: string | null | undefined): Promise<string | null> {
  if (!url) {
    return null;
  }

  // Déjà embarquée (data:) ou déjà locale (file:) : rien à faire.
  if (url.startsWith('data:')) {
    return url;
  }

  if (dataUriCache.has(url)) {
    return dataUriCache.get(url) ?? null;
  }

  let resolved: string | null = null;

  try {
    if (url.startsWith('file://')) {
      const base64 = await FileSystem.readAsStringAsync(url, {
        encoding: FileSystem.EncodingType.Base64,
      });
      resolved = base64 ? `data:${guessMimeTypeFromUrl(url)};base64,${base64}` : null;
    } else {
      resolved =
        Platform.OS === 'web' ? await fetchAsDataUriWeb(url) : await fetchAsDataUriNative(url);
    }
  } catch {
    resolved = null;
  }

  dataUriCache.set(url, resolved);

  return resolved;
}

/** À appeler quand un logo / une signature vient d'être remplacé. */
export function clearInlineImageCache(url?: string): void {
  if (url) {
    dataUriCache.delete(url);
    return;
  }

  dataUriCache.clear();
}

export async function inlinePdfClientSignature(
  signature: { url: string; signedAt: string } | null | undefined,
): Promise<{ url: string; signedAt: string } | null> {
  if (!signature?.url) {
    return null;
  }

  const inlinedUrl = await resolveInlineImage(signature.url);

  if (!inlinedUrl) {
    return null;
  }

  return { url: inlinedUrl, signedAt: signature.signedAt };
}

export async function inlinePdfCompanyImages(company: PdfCompanyInfo): Promise<PdfCompanyInfo> {
  const [logoUrl, signatureUrl] = await Promise.all([
    resolveInlineImage(company.logoUrl),
    resolveInlineImage(company.signatureUrl),
  ]);

  return {
    ...company,
    logoUrl,
    signatureUrl,
  };
}
