import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { A4_PRINT_OPTIONS } from '@/lib/pdf/a4';
import { ensurePdfFileUri } from '@/lib/pdf/pdf-file';

export type GeneratedPdf = {
  uri: string;
  fileName: string;
  numberOfPages: number;
};

export async function generatePdfFromHtml(html: string, fileName: string): Promise<GeneratedPdf> {
  // expo-print web: printToFileAsync() appelle window.print() et ne renvoie rien.
  // On sert un blob HTML préfixable (iframe) pour l’aperçu / partage navigateur.
  if (Platform.OS === 'web') {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const safeName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;

    return {
      uri: `html:${objectUrl}`,
      fileName: safeName,
      numberOfPages: 1,
    };
  }

  const printed = await Print.printToFileAsync({
    html,
    base64: false,
    width: A4_PRINT_OPTIONS.width,
    height: A4_PRINT_OPTIONS.height,
    margins: A4_PRINT_OPTIONS.margins,
  });

  if (!printed?.uri) {
    throw new Error('Impossible de générer le PDF.');
  }

  const normalizedUri = await ensurePdfFileUri(printed.uri, fileName);

  return {
    uri: normalizedUri,
    fileName: sanitizeFileNameFromUri(normalizedUri, fileName),
    numberOfPages: printed.numberOfPages ?? 1,
  };
}

function sanitizeFileNameFromUri(uri: string, fallback: string): string {
  const segment = uri.split('/').pop();

  if (segment && segment.toLowerCase().endsWith('.pdf')) {
    return segment;
  }

  return fallback.toLowerCase().endsWith('.pdf') ? fallback : `${fallback}.pdf`;
}

function resolveShareableUri(uri: string): string {
  return uri.startsWith('html:') ? uri.slice('html:'.length) : uri;
}

export async function sharePdf(uri: string, dialogTitle = 'Partager le document'): Promise<void> {
  const resolvedUri = resolveShareableUri(uri);

  if (Platform.OS === 'web') {
    // Ouvre l’aperçu HTML/PDF dans un nouvel onglet (fallback navigateur).
    if (typeof window !== 'undefined') {
      window.open(resolvedUri, '_blank', 'noopener,noreferrer');
    }
    return;
  }

  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    if (Platform.OS === 'ios') {
      await Print.printAsync({ uri: resolvedUri });
    }

    return;
  }

  await Sharing.shareAsync(resolvedUri, {
    mimeType: 'application/pdf',
    dialogTitle,
    UTI: 'com.adobe.pdf',
  });
}

export async function printPdf(uri: string): Promise<void> {
  const resolvedUri = resolveShareableUri(uri);

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const popup = window.open(resolvedUri, '_blank', 'noopener,noreferrer');
      popup?.print();
    }
    return;
  }

  await Print.printAsync({ uri: resolvedUri });
}

export async function shareHtmlAsPdf(
  html: string,
  fileName: string,
  dialogTitle?: string,
): Promise<GeneratedPdf> {
  const generated = await generatePdfFromHtml(html, fileName);
  await sharePdf(generated.uri, dialogTitle);
  return generated;
}

export async function generateHtmlAsPdf(html: string, fileName: string): Promise<GeneratedPdf> {
  return generatePdfFromHtml(html, fileName);
}
