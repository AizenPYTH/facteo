import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export function sanitizePdfFileName(fileName: string): string {
  const trimmed = fileName.trim() || 'document.pdf';
  const withExtension = trimmed.toLowerCase().endsWith('.pdf') ? trimmed : `${trimmed}.pdf`;

  return withExtension.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function ensurePdfFileUri(sourceUri: string, fileName: string): Promise<string> {
  const safeName = sanitizePdfFileName(fileName);
  const destinationUri = `${FileSystem.cacheDirectory}${safeName}`;
  const sourceInfo = await FileSystem.getInfoAsync(sourceUri);

  if (!sourceInfo.exists) {
    throw new Error('PDF introuvable sur l’appareil.');
  }

  if (sourceUri === destinationUri) {
    return destinationUri;
  }

  const destinationInfo = await FileSystem.getInfoAsync(destinationUri);

  if (destinationInfo.exists) {
    await FileSystem.deleteAsync(destinationUri, { idempotent: true });
  }

  await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });

  return destinationUri;
}

export async function resolveMailAttachmentUri(pdfUri: string, fileName: string): Promise<string> {
  const normalizedUri = await ensurePdfFileUri(pdfUri, fileName);

  if (Platform.OS === 'android') {
    return FileSystem.getContentUriAsync(normalizedUri);
  }

  return normalizedUri;
}
