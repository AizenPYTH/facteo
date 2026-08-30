import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { buildProductImportTemplateBytes } from '@/lib/products/spreadsheet-import';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function downloadProductImportTemplate(): Promise<void> {
  const bytes = buildProductImportTemplateBytes();

  if (Platform.OS === 'web') {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const blob = new Blob([copy], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'INVEQ-modele-import-produits.xlsx';
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }

  const destinationUri = `${FileSystem.cacheDirectory}INVEQ-modele-import-produits.xlsx`;
  await FileSystem.writeAsStringAsync(destinationUri, bytesToBase64(bytes), {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Partage de fichier indisponible sur cet appareil.');
  }

  await Sharing.shareAsync(destinationUri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: 'Télécharger le modèle Excel INVEQ',
    UTI: 'org.openxmlformats.spreadsheetml.sheet',
  });
}
