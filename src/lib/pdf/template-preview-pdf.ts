import * as FileSystem from 'expo-file-system/legacy';

import { generateHtmlAsPdf } from '@/lib/pdf/share';

const memoryCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

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

export async function ensureTemplatePreviewPdf(
  namespace: string,
  templateId: string,
  buildHtml: (templateId: string) => Promise<string>,
): Promise<string> {
  const key = memoryKey(namespace, templateId);
  const cachedUri = memoryCache.get(key);

  if (cachedUri) {
    const info = await FileSystem.getInfoAsync(cachedUri);
    if (info.exists) {
      return cachedUri;
    }

    memoryCache.delete(key);
  }

  const diskPath = cacheFilePath(namespace, templateId);
  const diskInfo = await FileSystem.getInfoAsync(diskPath);

  if (diskInfo.exists) {
    memoryCache.set(key, diskPath);
    return diskPath;
  }

  const pending = inflight.get(key);
  if (pending) {
    return pending;
  }

  const task = (async () => {
    const html = await buildHtml(templateId);
    const generated = await generateHtmlAsPdf(html, `template-${templateId}.pdf`);

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

export function invalidateTemplatePreviewCache(namespace: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(`${namespace}::`)) {
      memoryCache.delete(key);
    }
  }
}
