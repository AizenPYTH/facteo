import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { buildPdfJsViewerHtml } from '@/lib/pdf/pdfjs-viewer-html';

export type PdfPreviewMode = 'native' | 'pdfjs';

export type PdfPreviewSource = {
  mode: PdfPreviewMode;
  uri?: string;
  html?: string;
  baseUrl?: string;
  allowingReadAccessToURL?: string;
};

export type PdfPreviewSourceOptions = {
  /** Force pdf.js viewer for consistent page-fit rendering (template catalog). */
  preferPdfJs?: boolean;
};

function getParentDirectory(uri: string): string | undefined {
  const normalized = uri.replace('file://', '');
  const lastSlash = normalized.lastIndexOf('/');

  if (lastSlash <= 0) {
    return undefined;
  }

  return `file://${normalized.slice(0, lastSlash)}`;
}

async function buildPdfJsPreviewSource(pdfUri: string): Promise<PdfPreviewSource> {
  const canLoadByUrl =
    Platform.OS === 'web' &&
    (pdfUri.startsWith('blob:') ||
      pdfUri.startsWith('http://') ||
      pdfUri.startsWith('https://') ||
      pdfUri.startsWith('data:'));

  if (canLoadByUrl) {
    return {
      mode: 'pdfjs',
      html: buildPdfJsViewerHtml({ mode: 'url', pdfUrl: pdfUri }),
      baseUrl: typeof window !== 'undefined' ? window.location.origin : 'https://localhost',
    };
  }

  const base64 = await FileSystem.readAsStringAsync(pdfUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return {
    mode: 'pdfjs',
    html: buildPdfJsViewerHtml({ mode: 'base64', base64 }),
    baseUrl: 'https://localhost',
  };
}

export async function buildPdfPreviewSource(
  pdfUri: string,
  options?: PdfPreviewSourceOptions,
): Promise<PdfPreviewSource> {
  const usePdfJs = options?.preferPdfJs || Platform.OS === 'web';

  if (Platform.OS === 'ios' && !usePdfJs) {
    return {
      mode: 'native',
      uri: pdfUri,
      allowingReadAccessToURL: getParentDirectory(pdfUri),
    };
  }

  return buildPdfJsPreviewSource(pdfUri);
}
