import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  Text,
  View,
} from 'react-native';

import { ProductAnalysisBatchModal } from '@/components/ai/product-analysis-batch-modal';
import {
  ProductAnalysisConfirmationModal,
  type ProductAnalysisDraft,
} from '@/components/ai/product-analysis-confirmation-modal';
import { ProductAnalysisLoadingModal } from '@/components/ai/product-analysis-loading-modal';
import { FeatureIntroModal } from '@/components/feature-intros';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useThemedStyles } from '@/hooks/use-colors';
import { useFeatureIntro } from '@/hooks/use-feature-intro';
import { usePlatformActionSheet } from '@/hooks/use-platform-action-sheet';
import { useSubscription } from '@/hooks/use-subscription';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { analyzeProductImage } from '@/lib/ai/product-image-analysis';
import { readLocalFileAsBytes } from '@/lib/files/read-as-bytes';
import { downloadProductImportTemplate } from '@/lib/products/download-import-template';
import { mapAnalysisToDraft, mapImportRowToDraft } from '@/lib/products/map-product-draft';
import {
  parseProductCsv,
  parseProductSpreadsheet,
  type ImportedProductRow,
} from '@/lib/products/spreadsheet-import';
import { createProduct, findProductByBarcode } from '@/lib/supabase/products';
import { useToast } from '@/providers/toast-provider';
import type { QuoteLineValue } from '@/types/quote';
import { createEmptyQuoteLine, formatDecimalForInput } from '@/types/quote';
import { router, type Href } from 'expo-router';

import { ProductBarcodeScannerModal } from '@/components/ai/product-barcode-scanner-modal';

import { QuoteLine } from './quote-line';

type QuoteAddLinesStepProps = {
  lines: QuoteLineValue[];
  onAddLine: (line: QuoteLineValue) => void;
  onChangeLine: (index: number, line: QuoteLineValue) => void;
  onRemoveLine: (index: number) => void;
};

export function QuoteAddLinesStep({
  lines,
  onAddLine,
  onChangeLine,
  onRemoveLine,
}: QuoteAddLinesStepProps) {
  const styles = useStyles();
  const { openActionSheet, actionSheetNode } = usePlatformActionSheet();
  const { user } = useAuth();
  const { hasFeature } = useSubscription();
  const { showError, showSuccess } = useToast();
  const scannerIntro = useFeatureIntro('scanner');
  const aiIntro = useFeatureIntro('ai');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0.08);
  const [analysisImageUri, setAnalysisImageUri] = useState<string | null>(null);
  const [analysisDraft, setAnalysisDraft] = useState<ProductAnalysisDraft | null>(null);
  const [batchDrafts, setBatchDrafts] = useState<ProductAnalysisDraft[] | null>(null);
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);
  const [pendingBarcodeHint, setPendingBarcodeHint] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      clearProgressTimer(progressTimerRef);
    };
  }, []);

  function handleAddManualPrestation() {
    onAddLine(createEmptyQuoteLine());
  }

  function ensureAiAccess(): boolean {
    if (!hasFeature('ai_assistant')) {
      router.push('/settings/premium' as Href);
      return false;
    }
    return true;
  }

  function handleAddPrestation() {
    openActionSheet({
      title: 'Ajouter une prestation',
      options: [
        {
          label: 'Ajouter manuellement',
          onPress: handleAddManualPrestation,
        },
        {
          label: 'Code-barres produit',
          onPress: () => {
            scannerIntro.runWithIntro(() => {
              setBarcodeScannerVisible(true);
            });
          },
        },
        {
          label: 'Photo / capture produit (IA)',
          onPress: () => {
            if (!ensureAiAccess()) return;
            aiIntro.runWithIntro(() => {
              void handleSourceSelection(Platform.OS === 'web' ? 'gallery' : 'camera');
            });
          },
        },
        {
          label: 'Importer Excel / CSV',
          onPress: () => {
            void handleImportSpreadsheet();
          },
        },
        {
          label: 'Télécharger le modèle Excel',
          onPress: () => {
            void handleDownloadTemplate();
          },
        },
      ],
    });
  }

  async function handleDownloadTemplate() {
    try {
      await downloadProductImportTemplate();
      showSuccess('Modèle Excel prêt à partager / télécharger.');
    } catch (error) {
      showError(readAiErrorMessage(error));
    }
  }

  async function handleBarcode(code: string) {
    setBarcodeScannerVisible(false);
    try {
      const existing = await findProductByBarcode(code);
      if (existing) {
        onAddLine({
          id: createEmptyQuoteLine().id,
          productId: existing.id,
          description: existing.name,
          quantity: '1',
          unit: existing.unit || 'pièce',
          unitPrice: formatDecimalForInput(existing.unit_price),
          vatRate: formatDecimalForInput(existing.vat_rate),
          discountPercent: '0',
        });
        showSuccess('Produit trouvé dans votre catalogue.');
        return;
      }

      Alert.alert(
        'Produit introuvable',
        `Aucun produit catalogue pour le code ${code}. Continuez avec une photo/capture (Amazon, fiche fournisseur…) pour l’identifier via le même service IA que le site.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Photo produit',
            onPress: () => {
              if (!ensureAiAccess()) return;
              setPendingBarcodeHint(code);
              void handleSourceSelection(Platform.OS === 'web' ? 'gallery' : 'camera', code);
            },
          },
        ],
      );
    } catch (error) {
      showError(readAiErrorMessage(error));
    }
  }

  async function handleImportSpreadsheet() {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          'text/plain',
          'public.comma-separated-values-text',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (picked.canceled || !picked.assets?.[0]) {
        return;
      }

      const asset = picked.assets[0];
      const name = (asset.name ?? '').toLowerCase();
      let rows: ImportedProductRow[] = [];

      if (name.endsWith('.csv') || name.endsWith('.txt') || asset.mimeType?.includes('csv')) {
        const bytes = await readLocalFileAsBytes(asset.uri);
        const text = new TextDecoder().decode(bytes);
        rows = parseProductCsv(text);
      } else {
        const bytes = await readLocalFileAsBytes(asset.uri);
        rows = parseProductSpreadsheet(bytes);
      }

      if (rows.length === 0) {
        showError('Aucun produit exploitable dans ce fichier.');
        return;
      }

      const drafts = rows.map(mapImportRowToDraft);
      if (drafts.length === 1) {
        setAnalysisImageUri(null);
        setAnalysisDraft(drafts[0] ?? null);
      } else {
        setAnalysisImageUri(null);
        setBatchDrafts(drafts);
      }
    } catch (error) {
      showError(readAiErrorMessage(error));
    }
  }

  async function handleSourceSelection(
    source: 'camera' | 'gallery',
    barcodeHint?: string | null,
  ) {
    try {
      if (!ensureAiAccess()) {
        return;
      }

      const selected = await pickImageSource(source);

      if (!selected) {
        return;
      }

      setAnalysisImageUri(selected.uri);
      setIsAnalyzing(true);
      setAnalysisProgress(0.1);
      startProgressTimer(progressTimerRef, setAnalysisProgress);

      const analyzed = await analyzeProductImage({
        imageBase64: selected.base64,
        mimeType: selected.mimeType,
        barcodeHint: barcodeHint ?? pendingBarcodeHint ?? undefined,
      });

      setAnalysisProgress(1);
      const products =
        Array.isArray(analyzed.products) && analyzed.products.length > 0
          ? analyzed.products
          : [analyzed];
      const drafts = products.map(mapAnalysisToDraft);

      if (drafts.length > 1) {
        setAnalysisDraft(null);
        setBatchDrafts(drafts);
      } else {
        setBatchDrafts(null);
        setAnalysisDraft(drafts[0] ?? null);
      }
      setPendingBarcodeHint(null);
    } catch (error) {
      const message = readAiErrorMessage(error);

      if (message.includes('Permission caméra bloquée')) {
        Alert.alert('Caméra requise', message, [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Ouvrir les réglages',
            onPress: () => {
              void Linking.openSettings();
            },
          },
        ]);
      } else {
        showError(message);
      }
    } finally {
      clearProgressTimer(progressTimerRef);
      setIsAnalyzing(false);
    }
  }

  function handleCloseConfirmationModal() {
    setAnalysisDraft(null);
    setAnalysisImageUri(null);
  }

  function handleCloseBatchModal() {
    setBatchDrafts(null);
    setAnalysisImageUri(null);
  }

  async function addDraftAsLine(draft: ProductAnalysisDraft, persistCatalog: boolean) {
    if (!user?.id) {
      throw new Error('Session invalide. Reconnectez-vous puis réessayez.');
    }

    const title = draft.title.trim();
    const description = draft.description.trim();
    const reference = draft.reference.trim();
    const unit = (draft.unit.trim() || 'pièce').toLowerCase();
    const quantity = parseNumericInput(draft.quantity) ?? 1;
    const vatRate = parseNumericInput(draft.vatRate);
    const priceHt = resolvePriceHt(draft);

    if (!title && !description) {
      throw new Error('Ajoutez au moins un nom ou une description.');
    }

    let productId: string | null = null;

    if (persistCatalog && vatRate !== null && priceHt !== null) {
      const product = await createProduct({
        userId: user.id,
        name: title || description || 'Produit importé',
        description,
        unitPrice: priceHt,
        vatRate,
        unit,
        reference,
        type: 'product',
        brand: draft.brand.trim() || undefined,
        sku: draft.sku.trim() || undefined,
        barcodeEan: draft.ean.trim() || undefined,
      });
      productId = product.id;
    }

    onAddLine({
      id: createEmptyQuoteLine().id,
      productId,
      description: title || description || 'Produit importé',
      quantity: formatDecimalForInput(quantity),
      unit,
      unitPrice: priceHt === null ? '' : formatDecimalForInput(priceHt),
      vatRate: vatRate === null ? '' : formatDecimalForInput(vatRate),
      discountPercent: '0',
    });
  }

  async function handleConfirmAiProduct() {
    if (!analysisDraft) {
      return;
    }

    try {
      setIsSavingProduct(true);
      await addDraftAsLine(analysisDraft, true);
      showSuccess('Produit ajouté à votre document.');
      handleCloseConfirmationModal();
    } catch (error) {
      showError(readAiErrorMessage(error));
    } finally {
      setIsSavingProduct(false);
    }
  }

  async function handleConfirmBatch(items: ProductAnalysisDraft[]) {
    if (items.length === 0) {
      showError('Sélectionnez au moins un produit.');
      return;
    }

    try {
      setIsSavingProduct(true);
      for (const item of items) {
        await addDraftAsLine(item, true);
      }
      showSuccess(`${items.length} produit(s) ajouté(s) au document.`);
      handleCloseBatchModal();
    } catch (error) {
      showError(readAiErrorMessage(error));
    } finally {
      setIsSavingProduct(false);
    }
  }

  const modals = (
    <>
      {actionSheetNode}
      <FeatureIntroModal
        config={scannerIntro.config}
        onClose={scannerIntro.onClose}
        onCta={scannerIntro.onCta}
        onDontShowAgain={scannerIntro.onDontShowAgain}
        visible={scannerIntro.visible}
      />
      <FeatureIntroModal
        config={aiIntro.config}
        onClose={aiIntro.onClose}
        onCta={aiIntro.onCta}
        onDontShowAgain={aiIntro.onDontShowAgain}
        visible={aiIntro.visible}
      />
      <ProductAnalysisLoadingModal progress={analysisProgress} visible={isAnalyzing} />
      <ProductBarcodeScannerModal
        visible={barcodeScannerVisible}
        onBarcode={(code) => {
          void handleBarcode(code);
        }}
        onClose={() => setBarcodeScannerVisible(false)}
        onFallbackPhotoSearch={() => {
          setBarcodeScannerVisible(false);
          if (!ensureAiAccess()) return;
          aiIntro.runWithIntro(() => {
            void handleSourceSelection(Platform.OS === 'web' ? 'gallery' : 'camera');
          });
        }}
      />
      {analysisDraft ? (
        <ProductAnalysisConfirmationModal
          imageUri={analysisImageUri ?? ''}
          isSaving={isSavingProduct}
          onChange={setAnalysisDraft}
          onClose={handleCloseConfirmationModal}
          onConfirm={() => {
            void handleConfirmAiProduct();
          }}
          value={analysisDraft}
          visible
        />
      ) : null}
      {batchDrafts ? (
        <ProductAnalysisBatchModal
          imageUri={analysisImageUri}
          isSaving={isSavingProduct}
          items={batchDrafts}
          onChangeItems={setBatchDrafts}
          onClose={handleCloseBatchModal}
          onConfirmSelected={(items) => {
            void handleConfirmBatch(items);
          }}
          visible
        />
      ) : null}
    </>
  );

  const listHeader = (
    <View style={styles.headerSection}>
      <Text style={styles.description}>
        Ajoutez vos prestations : manuel, code-barres, photo IA ou Excel.
      </Text>

      <Button onPress={handleAddPrestation} title="Ajouter une prestation" />
      {Platform.OS === 'web' ? (
        <Button
          onPress={() => {
            if (!ensureAiAccess()) return;
            aiIntro.runWithIntro(() => {
              void handleSourceSelection('gallery');
            });
          }}
          title="Scanner un produit (IA)"
          variant="ghost"
        />
      ) : null}

      <View style={styles.prestationsHeader}>
        <Text style={styles.sectionLabel}>Prestations ({lines.length})</Text>
      </View>
    </View>
  );

  if (lines.length === 0) {
    return (
      <>
        <View style={styles.container}>
          {listHeader}
          <View style={styles.emptyPrestations}>
            <Text style={styles.emptyPrestationsText}>
              Appuyez sur « Ajouter une prestation » pour commencer.
            </Text>
          </View>
        </View>
        {modals}
      </>
    );
  }

  return (
    <>
      <FlatList
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.listContent}
        data={lines}
        keyExtractor={(item) => item.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        ListHeaderComponent={listHeader}
        renderItem={({ item, index }) => (
          <QuoteLine
            index={index}
            onChange={(updatedLine) => onChangeLine(index, updatedLine)}
            onRemove={() => onRemoveLine(index)}
            value={item}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
      {modals}
    </>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      flex: 1,
    },
    listContent: {
      gap: spacing.lg,
      paddingBottom: spacing.lg,
    },
    headerSection: {
      gap: spacing.lg,
      paddingBottom: spacing.sm,
    },
    description: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    sectionLabel: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    prestationsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    emptyPrestations: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
    },
    emptyPrestationsText: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  }));
}

function clearProgressTimer(timerRef: MutableRefObject<ReturnType<typeof setInterval> | null>) {
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }
}

function startProgressTimer(
  timerRef: MutableRefObject<ReturnType<typeof setInterval> | null>,
  setProgress: Dispatch<SetStateAction<number>>,
) {
  clearProgressTimer(timerRef);
  timerRef.current = setInterval(() => {
    setProgress((current) => (current >= 0.92 ? current : current + 0.06));
  }, 280);
}

async function pickImageSource(source: 'camera' | 'gallery'): Promise<{
  uri: string;
  base64: string;
  mimeType: string;
} | null> {
  if (source === 'camera' && Platform.OS !== 'web') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      if (!permission.canAskAgain) {
        throw new Error(
          "Permission caméra bloquée. Activez-la dans Réglages pour scanner un produit avec l'IA.",
        );
      }
      throw new Error('Permission refusée pour utiliser l’appareil photo.');
    }
  }

  if (source === 'gallery' && Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Permission refusée pour accéder à la photothèque.');
    }
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.9,
          base64: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.9,
          base64: true,
        });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];

  if (!asset.base64) {
    throw new Error('Capture invalide. Réessayez avec une autre image.');
  }

  return {
    uri: asset.uri,
    base64: asset.base64,
    mimeType: asset.mimeType ?? 'image/jpeg',
  };
}

function parseNumericInput(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function computePriceHtFromTtc(priceTtc: number, vatRate: number): number {
  const divider = 1 + Math.max(vatRate, 0) / 100;
  return divider > 0 ? priceTtc / divider : priceTtc;
}

function resolvePriceHt(draft: ProductAnalysisDraft): number | null {
  const directHt = parseNumericInput(draft.unitPriceHt);

  if (directHt !== null) {
    return directHt;
  }

  const ttc = parseNumericInput(draft.unitPriceTtc);
  const vatRate = parseNumericInput(draft.vatRate);

  if (ttc === null) {
    return null;
  }

  if (vatRate === null) {
    // Without reliable VAT, do not invent HT from TTC.
    return null;
  }

  return computePriceHtFromTtc(ttc, vatRate);
}

function readAiErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;

    if (message.includes('Permission refusée')) {
      return 'Autorisez la caméra ou les fichiers pour scanner un produit.';
    }

    if (message.includes('Permission caméra bloquée')) {
      return message;
    }

    if (message.includes('Network') || message.includes('Failed to fetch')) {
      return 'Connexion réseau indisponible. Vérifiez votre accès Internet.';
    }

    if (message.includes('Unauthorized') || message.includes('Session')) {
      return 'Session expirée. Reconnectez-vous puis réessayez.';
    }

    if (message.includes("n'est pas encore configuré") || message.includes('n’est pas encore configuré')) {
      return "L'assistant IA n'est pas encore configuré.";
    }

    return message || 'Analyse impossible pour cette image.';
  }

  return 'Analyse impossible pour cette image.';
}
