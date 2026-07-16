import * as FileSystem from 'expo-file-system/legacy';

import { generateHtmlAsPdf } from '@/lib/pdf/share';

const memoryCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();
const MIN_PDF_BYTES = 512;

function memoryKey(namespace: string, templateId: string): string {
  return `${namespace}::${templateId}`;
}

function cacheDirectory(namespace: string): string {
  const safeNamespace = namespace.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${FileSystem.cacheDirectory}template-previews/${safeNamespace}`;
}

function cacheFilePath(namespace: string, templateId: string): string {
  const safeTemplateId = templateId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${cacheDirectory(namespace)}/${safeTemplateId}.pdf`;
}

async function isValidPdfFile(uri: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(uri);

  if (!info.exists || info.size == null) {
    return false;
  }

  return info.size >= MIN_PDF_BYTES;
}

export async function ensureTemplatePreviewPdf(
  namespace: string,
  templateId: string,
  buildHtml: (templateId: string) => Promise<string>,
): Promise<string> {
  const key = memoryKey(namespace, templateId);
  const cachedUri = memoryCache.get(key);

  if (cachedUri) {
    if (await isValidPdfFile(cachedUri)) {
      return cachedUri;
    }

    memoryCache.delete(key);
  }

  const diskPath = cacheFilePath(namespace, templateId);

  if (await isValidPdfFile(diskPath)) {
    memoryCache.set(key, diskPath);
    return diskPath;
  }

  const pending = inflight.get(key);
  if (pending) {
    return pending;
  }

  const task = (async () => {
    const html = (await buildHtml(templateId)).trim();

    if (!html) {
      throw new Error('Aperçu indisponible : données entreprise incomplètes.');
    }

    const generated = await generateHtmlAsPdf(html, `template-${templateId}.pdf`);

    if (!(await isValidPdfFile(generated.uri))) {
      throw new Error('Le PDF généré est vide.');
    }

    await FileSystem.makeDirectoryAsync(cacheDirectory(namespace), {
      intermediates: true,
    });
    await FileSystem.copyAsync({ from: generated.uri, to: diskPath });

    memoryCache.set(key, diskPath);
    return diskPath;
  })();

  inflight.set(key, task);

  try {
    return await task;
  } finally {
    inflight.delete(key);
  }
}

export async function invalidateTemplatePreviewCache(namespace: string): Promise<void> {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(`${namespace}::`)) {
      memoryCache.delete(key);
    }
  }

  const directory = cacheDirectory(namespace);
  const info = await FileSystem.getInfoAsync(directory);

  if (info.exists) {
    await FileSystem.deleteAsync(directory, { idempotent: true });
  }
}
