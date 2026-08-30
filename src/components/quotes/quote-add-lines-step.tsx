import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
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
  Pressable,
  Text,
  View,
} from 'react-native';

import { ProductAnalysisBatchModal } from '@/components/ai/product-analysis-batch-modal';
import {
  ProductAnalysisConfirmationModal,
  type ProductAnalysisDraft,
} from '@/components/ai/product-analysis-confirmation-modal';
import { ProductAnalysisLoadingModal } from '@/components/ai/product-analysis-loading-modal';
import { ExcelImportSheet } from '@/components/ai/excel-import-sheet';
import { FeatureIntroModal } from '@/components/feature-intros';
import { ProductCatalogPickerModal } from '@/components/quotes/product-catalog-picker-modal';
import { useAuth } from '@/hooks/use-auth';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useFeatureIntro } from '@/hooks/use-feature-intro';
import { useSubscription } from '@/hooks/use-subscription';
import { radius } from '@/constants/theme/radius';
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
import { createProduct } from '@/lib/supabase/products';
import { useToast } from '@/providers/toast-provider';
import type { ProductRow } from '@/types/database';
import type { QuoteLineValue } from '@/types/quote';
import { createEmptyQuoteLine, formatDecimalForInput } from '@/types/quote';
import { router, type Href } from 'expo-router';

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
  const { user } = useAuth();
  const { hasFeature, isPremium } = useSubscription();
  const { showError, showSuccess } = useToast();
  const aiIntro = useFeatureIntro('ai');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0.08);
  const [analysisImageUri, setAnalysisImageUri] = useState<string | null>(null);
  const [analysisDraft, setAnalysisDraft] = useState<ProductAnalysisDraft | null>(null);
  const [batchDrafts, setBatchDrafts] = useState<ProductAnalysisDraft[] | null>(null);
  const [catalogPickerVisible, setCatalogPickerVisible] = useState(false);
  const [excelImportVisible, setExcelImportVisible] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [pendingBarcodeHint, setPendingBarcodeHint] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const analysisAbortRef = useRef(false);
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
    if (hasFeature('ai_assistant') || isPremium) {
      return true;
    }
    router.push('/settings/premium' as Href);
    return false;
  }

  function handleOpenPhotoAi() {
    if (!ensureAiAccess()) return;
    aiIntro.runWithIntro(() => {
      void handleSourceSelection(Platform.OS === 'web' ? 'gallery' : 'camera');
    });
  }

  function handleOpenCatalog() {
    setCatalogPickerVisible(true);
  }

  function handleCatalogSelect(product: ProductRow) {
    setCatalogPickerVisible(false);
    setAnalysisImageUri(null);
    setAnalysisDraft(mapProductRowToDraft(product, 'Catalogue'));
  }

  function handleOpenExcelImport() {
    setExcelImportVisible(true);
  }

  async function handleDownloadTemplate() {
    setIsDownloadingTemplate(true);
    try {
      await downloadProductImportTemplate();
      showSuccess('Modèle Excel prêt à partager / télécharger.');
    } catch (error) {
      showError(readAiErrorMessage(error));
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  async function handleImportSpreadsheet() {
    setExcelImportVisible(false);
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

      analysisAbortRef.current = false;
      setAnalysisImageUri(selected.uri);
      setIsAnalyzing(true);
      setAnalysisProgress(0.1);
      startProgressTimer(progressTimerRef, setAnalysisProgress);

      const analyzed = await analyzeProductImage({
        imageBase64: selected.base64,
        mimeType: selected.mimeType,
        barcodeHint: barcodeHint ?? pendingBarcodeHint ?? undefined,
      });

      if (analysisAbortRef.current) {
        return;
      }

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
      if (analysisAbortRef.current) {
        return;
      }
      const message = readAiErrorMessage(error);

      if (message.includes('Permission caméra bloquée') || message.toLowerCase().includes('caméra')) {
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

  function handleCancelAnalysis() {
    analysisAbortRef.current = true;
    clearProgressTimer(progressTimerRef);
    setIsAnalyzing(false);
    setAnalysisImageUri(null);
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

  async function handleConfirmAiProduct(persistCatalog: boolean) {
    if (!analysisDraft) {
      return;
    }

    try {
      setIsSavingProduct(true);
      await addDraftAsLine(analysisDraft, persistCatalog);
      showSuccess(
        persistCatalog
          ? 'Produit ajouté au document et au catalogue.'
          : 'Produit ajouté au document.',
      );
      handleCloseConfirmationModal();
    } catch (error) {
      showError(readAiErrorMessage(error));
    } finally {
      setIsSavingProduct(false);
    }
  }

  async function handleConfirmBatch(items: ProductAnalysisDraft[], persistCatalog: boolean) {
    if (items.length === 0) {
      showError('Sélectionnez au moins un produit.');
      return;
    }

    try {
      setIsSavingProduct(true);
      for (const item of items) {
        await addDraftAsLine(item, persistCatalog);
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
      <FeatureIntroModal
        config={aiIntro.config}
        onClose={aiIntro.onClose}
        onCta={aiIntro.onCta}
        onDontShowAgain={aiIntro.onDontShowAgain}
        visible={aiIntro.visible}
      />
      <ProductAnalysisLoadingModal
        onCancel={handleCancelAnalysis}
        progress={analysisProgress}
        visible={isAnalyzing}
      />
      <ExcelImportSheet
        downloading={isDownloadingTemplate}
        onClose={() => setExcelImportVisible(false)}
        onDownloadTemplate={() => {
          void handleDownloadTemplate();
        }}
        onPickFile={() => {
          void handleImportSpreadsheet();
        }}
        visible={excelImportVisible}
      />
      <ProductCatalogPickerModal
        onClose={() => setCatalogPickerVisible(false)}
        onSelect={handleCatalogSelect}
        visible={catalogPickerVisible}
      />
      {analysisDraft ? (
        <ProductAnalysisConfirmationModal
          imageUri={analysisImageUri ?? ''}
          isSaving={isSavingProduct}
          onChange={setAnalysisDraft}
          onClose={handleCloseConfirmationModal}
          onConfirm={(persistCatalog) => {
            void handleConfirmAiProduct(persistCatalog);
          }}
          onScanNext={() => {
            handleCloseConfirmationModal();
            handleOpenPhotoAi();
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
          onConfirmSelected={(items, persistCatalog) => {
            void handleConfirmBatch(items, persistCatalog);
          }}
          visible
        />
      ) : null}
    </>
  );

  const listHeader = (
    <View style={styles.headerSection}>
      <Text style={styles.description}>Ajoutez vos prestations.</Text>

      <View style={styles.entryRow}>
        <AddEntryButton icon="camera.fill" label="Photo IA" onPress={handleOpenPhotoAi} />
        <AddEntryButton icon="square.grid.2x2" label="Catalogue" onPress={handleOpenCatalog} />
        <AddEntryButton
          icon="square.and.pencil"
          label="Saisie libre"
          onPress={handleAddManualPrestation}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={handleOpenExcelImport}
        style={({ pressed }) => [styles.excelEntry, pressed && styles.excelEntryPressed]}>
        <View style={styles.excelEntryText}>
          <Text style={styles.featureHintTitle}>Importer Excel</Text>
          <Text style={styles.featureHintBody}>Importez plusieurs données rapidement.</Text>
        </View>
      </Pressable>

      <View style={styles.featureHints}>
        <Text style={styles.featureHintTitle}>Photo IA</Text>
        <Text style={styles.featureHintBody}>Analysez automatiquement vos documents.</Text>
      </View>

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
              Prenez une photo, importez Excel, choisissez dans le catalogue ou saisissez librement.
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

type AddEntryButtonProps = {
  icon: Parameters<typeof SymbolView>[0]['name'];
  label: string;
  onPress: () => void;
};

/** Entrée exposée d'emblée — DESIGN §5.3 (Scanner, Catalogue, Saisie libre). */
function AddEntryButton({ icon, label, onPress }: AddEntryButtonProps) {
  const styles = useEntryButtonStyles();
  const colors = useColors();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.entry, pressed && styles.entryPressed]}>
      <SymbolView name={icon} size={20} tintColor={colors.primary} type="hierarchical" />
      <Text maxFontSizeMultiplier={1.4} style={styles.entryLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

function useEntryButtonStyles() {
  return useThemedStyles((colors) => ({
    entry: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: radius.card,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    entryPressed: {
      backgroundColor: colors.surfaceSecondary,
    },
    entryLabel: {
      ...typography.footnoteMedium,
      color: colors.text,
      textAlign: 'center',
    },
  }));
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
    entryRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    excelEntry: {
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    excelEntryPressed: {
      backgroundColor: colors.surfaceSecondary,
    },
    excelEntryText: {
      gap: 2,
    },
    featureHints: {
      gap: 2,
      paddingVertical: spacing.xs,
    },
    featureHintTitle: {
      ...typography.footnoteMedium,
      color: colors.text,
    },
    featureHintBody: {
      ...typography.caption1,
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

function mapProductRowToDraft(product: ProductRow, sourceLabel: string): ProductAnalysisDraft {
  return {
    title: product.name,
    brand: product.brand ?? '',
    model: '',
    reference: product.reference ?? '',
    description: product.description ?? '',
    unitPriceHt: formatDecimalForInput(product.unit_price),
    unitPriceTtc: '',
    vatRate: formatDecimalForInput(product.vat_rate),
    currency: 'EUR',
    unit: product.unit || 'pièce',
    quantity: '1',
    confidence: 1,
    sku: product.sku ?? '',
    ean: product.barcode_ean ?? '',
    sourceUrl: sourceLabel,
  };
}
