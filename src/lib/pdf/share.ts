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
  const { uri, numberOfPages } = await Print.printToFileAsync({
    html,
    base64: false,
    width: A4_PRINT_OPTIONS.width,
    height: A4_PRINT_OPTIONS.height,
    margins: A4_PRINT_OPTIONS.margins,
  });

  const normalizedUri = await ensurePdfFileUri(uri, fileName);

  return {
    uri: normalizedUri,
    fileName: sanitizeFileNameFromUri(normalizedUri, fileName),
    numberOfPages,
  };
}

function sanitizeFileNameFromUri(uri: string, fallback: string): string {
  const segment = uri.split('/').pop();

  if (segment && segment.toLowerCase().endsWith('.pdf')) {
    return segment;
  }

  return fallback.toLowerCase().endsWith('.pdf') ? fallback : `${fallback}.pdf`;
}

export async function sharePdf(uri: string, dialogTitle = 'Partager le document'): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    if (Platform.OS === 'ios') {
      await Print.printAsync({ uri });
    }

    return;
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle,
    UTI: 'com.adobe.pdf',
  });
}

export async function printPdf(uri: string): Promise<void> {
  await Print.printAsync({ uri });
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
