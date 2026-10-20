import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { importCatalogProducts, type CatalogImportResult } from '@/lib/catalog/import-products';
import {
  readSpreadsheetProducts,
  SPREADSHEET_MIME_TYPES,
  type ImportedProduct,
} from '@/lib/catalog/spreadsheet-import';
import { catalogQueryKeys } from '@/lib/supabase/query-keys';

export type PendingCatalogImport = {
  fileName: string;
  items: ImportedProduct[];
};

const ACCEPTED_EXTENSIONS = ['xlsx', 'xls', 'xlsm', 'xlsb', 'csv', 'txt', 'tsv'];

/**
 * Import d'un catalogue depuis un fichier Excel ou CSV : choix du fichier,
 * lecture, puis enregistrement après confirmation (comme sur le site).
 */
export function useCatalogImport(type: 'product' | 'service') {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<PendingCatalogImport | null>(null);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  /** Ouvre le sélecteur ; renvoie un message d'erreur lisible, ou null. */
  async function pickFile(): Promise<string | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: SPREADSHEET_MIME_TYPES,
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    const extension = asset.name.toLowerCase().split('.').pop() ?? '';
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      return 'Choisissez un fichier Excel (.xlsx, .xls) ou CSV.';
    }

    setReading(true);
    try {
      const items = await readSpreadsheetProducts(asset.uri, asset.name, asset.file ?? null);
      setPending({ fileName: asset.name, items });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Lecture du fichier impossible.';
    } finally {
      setReading(false);
    }
  }

  async function confirm(updateExisting: boolean): Promise<CatalogImportResult> {
    if (!pending || !user) throw new Error('Aucun fichier à importer.');
    setSaving(true);
    setProgress({ done: 0, total: pending.items.length });
    try {
      const result = await importCatalogProducts(user.id, type, pending.items, {
        updateExisting,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      setPending(null);
      return result;
    } finally {
      setSaving(false);
      setProgress(null);
      void queryClient.invalidateQueries({ queryKey: catalogQueryKeys.all });
    }
  }

  return {
    pending,
    reading,
    saving,
    progress,
    pickFile,
    confirm,
    cancel: () => setPending(null),
  };
}
