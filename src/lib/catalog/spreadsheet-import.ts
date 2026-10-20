import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';

import { productsFromWorkbook, type ImportedProduct } from '@/lib/catalog/spreadsheet-parse';

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
