import type { GeneratedPdf } from '@/lib/pdf/share';

const cache = new Map<string, GeneratedPdf>();

export function getCachedPdf(documentId: string): GeneratedPdf | null {
  return cache.get(documentId) ?? null;
}

export function setCachedPdf(documentId: string, generated: GeneratedPdf): GeneratedPdf {
  cache.set(documentId, generated);
  return generated;
}

export function clearPdfCache(documentId?: string): void {
  if (!documentId) {
    cache.clear();
    return;
  }

  cache.delete(documentId);
}
