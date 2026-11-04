import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import * as XLSX from 'xlsx';

import {
  PRODUCT_IMPORT_TEMPLATE_HEADERS,
  productsFromWorkbook,
  type ImportedProduct,
} from '@/lib/catalog/spreadsheet-parse';

export {
  PRODUCT_IMPORT_TEMPLATE_HEADERS,
  SPREADSHEET_MIME_TYPES,
  type ImportedProduct,
} from '@/lib/catalog/spreadsheet-parse';

function extensionOf(name: string): string {
  return name.toLowerCase().split('.').pop() ?? '';
}

/**
 * Lit un fichier choisi sur l'appareil et renvoie les articles qu'il contient.
 * Sur le web, le sélecteur fournit directement le fichier (`file`).
 * Lève une erreur lisible si rien n'est exploitable.
 */
export async function readSpreadsheetProducts(
  uri: string,
  fileName: string,
  file?: Blob | null,
): Promise<ImportedProduct[]> {
  const isText = ['csv', 'txt', 'tsv'].includes(extensionOf(fileName));
  let workbook: XLSX.WorkBook;

  if (isText) {
    const raw = file
      ? await file.text()
      : await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
    workbook = XLSX.read(raw.replace(/^\uFEFF/, ''), { type: 'string' });
  } else if (file) {
    workbook = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array', dense: true });
  } else {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    workbook = XLSX.read(base64, { type: 'base64', dense: true });
  }

  const products = productsFromWorkbook(workbook);
  if (products.length === 0) {
    throw new Error(
      'Aucune ligne exploitable. Vérifiez que la première ligne contient les en-têtes (Nom, Prix HT, TVA…) ou utilisez le modèle INVEQ.',
    );
  }
  return products;
}

const TEMPLATE_FILE_NAME = 'INVEQ-modele-import-produits.xlsx';

/**
 * Modèle Excel d'import (mêmes colonnes que le site) : enregistré dans le
 * cache puis proposé à la feuille de partage (Fichiers, Mail, AirDrop…).
 * Sur le web, le fichier est téléchargé directement.
 */
export async function shareImportTemplate(): Promise<void> {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([Array.from(PRODUCT_IMPORT_TEMPLATE_HEADERS)]),
    'Produits',
  );

  if (Platform.OS === 'web') {
    XLSX.writeFile(workbook, TEMPLATE_FILE_NAME);
    return;
  }

  const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' }) as string;
  const uri = `${FileSystem.cacheDirectory}${TEMPLATE_FILE_NAME}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Le partage de fichiers est indisponible sur cet appareil.');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    UTI: 'org.openxmlformats.spreadsheetml.sheet',
    dialogTitle: 'Modèle d’import INVEQ',
  });
}
