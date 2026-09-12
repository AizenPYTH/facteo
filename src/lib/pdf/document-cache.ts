import type { GeneratedPdf } from '@/lib/pdf/output';

/**
 * Mémorise le dernier PDF produit pour un document + modèle donné, afin qu'un
 * appui sur « Partager » juste après « Aperçu » ne relance pas une génération.
 *
 * La clé inclut `updatedAt` : dès que la facture est modifiée, la clé change et
 * l'ancien PDF n'est plus servi. C'est ce qui empêche de partager un PDF périmé.
 */
const cache = new Map<string, GeneratedPdf>();

export function buildPdfCacheKey(parts: {
  documentId: string;
  templateId: string;
  updatedAt?: string | null;
}): string {
  return `${parts.documentId}:${parts.templateId}:${parts.updatedAt ?? ''}`;
}

export function getCachedPdf(key: string): GeneratedPdf | null {
  return cache.get(key) ?? null;
}

export function setCachedPdf(key: string, generated: GeneratedPdf): GeneratedPdf {
  cache.set(key, generated);
  return generated;
}

export function clearPdfCache(documentId?: string): void {
  if (!documentId) {
    cache.clear();
    return;
  }

  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(`${documentId}:`)) {
      cache.delete(key);
    }
  }
}
